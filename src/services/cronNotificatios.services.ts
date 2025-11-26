import dayjs from 'dayjs';
import prismaService from './prisma.services';
import { NotificacionTipo } from '@prisma/client';
import { log } from '../utils/formatLog';
import {
  contratoExpirandoMessage,
  eventoCalendarioMessage,
  actualizacionActuacionesProcesoJudicialMessage,
  actualizacionActuacionesSegundaInstanciaMessage,
} from '../utils/messageType';

export class CronNotificationsService {
  private prisma = prismaService;
  private targetDate = dayjs().add(7, "day").startOf("day").toDate();
  private nextDay = dayjs(this.targetDate).endOf("day").toDate();

  private async contractsUsers() {
    return this.prisma.contrato.findMany({
      where: {
        fechaFin: {
          gte: this.targetDate,
          lte: this.nextDay,
        }
      },
      include: {
        usuario: true,
      },
    });
  }

  private async notificationExists(usuarioId: number, tipo: NotificacionTipo, mensaje: string): Promise<boolean> {
    const existe = await this.prisma.notificaciones.findFirst({
      where: {
        usuarioId,
        tipo,
        mensaje,
        createdAt: {
          gte: dayjs().startOf("day").toDate(),
        },
      },
    });
    return !!existe;
  }

  private async createNotification({ usuarioId, titulo, tipo, mensaje }: { usuarioId: number, titulo: string, tipo: NotificacionTipo, mensaje: string }) {
    await this.prisma.notificaciones.create({
      data: {
        titulo,
        tipo,
        usuarioId,
        read: false,
        mensaje,
      },
    });
  }

  async contractsExpiringJob() {
    const contracts = await this.contractsUsers();
    let notificacionesCreadas = 0;

    for (const contract of contracts) {
      const mensaje = contratoExpirandoMessage(contract.usuario, contract.fechaFin);
      const existe = await this.notificationExists(contract.usuarioId, NotificacionTipo.CONTRATO_EXPIRANDO, mensaje.message);

      if (!existe) {
        await this.createNotification({
          usuarioId: contract.usuarioId,
          titulo: mensaje.title,
          tipo: mensaje.type,
          mensaje: mensaje.message,
        });
        notificacionesCreadas++;
      }
    }

    log.info(`📋 Notificaciones de contratos próximos a vencer: ${notificacionesCreadas} de ${contracts.length} contratos.`);
  }


  async notificarEventosCalendario() {
    const hoy = dayjs().startOf("day").toDate();
    const manana = dayjs().add(1, "day").endOf("day").toDate();

    const eventos = await this.prisma.eventosCalendario.findMany({
      where: {
        fechaFin: {
          gte: hoy,
          lte: manana,
        },
      },
      include: {
        usuario: true,
      },
    });

    let notificacionesCreadas = 0;

    for (const evento of eventos) {
      const mensaje = eventoCalendarioMessage(evento.titulo, evento.fechaInicio);
      const existe = await this.notificationExists(
        evento.usuarioId,
        NotificacionTipo.EVENTO_CALENDARIO,
        mensaje.message,
      );

      if (!existe) {
        await this.createNotification({
          usuarioId: evento.usuarioId,
          titulo: mensaje.title,
          tipo: mensaje.type,
          mensaje: mensaje.message,
        });
        notificacionesCreadas++;
      }
    }

    log.info(`📅 Notificaciones de eventos del calendario: ${notificacionesCreadas} de ${eventos.length} eventos.`);
  }

  async notificarNuevasActuacionesProcesoJudicialDelDia() {
    const hoy = dayjs().startOf("day").toDate();
    const ahora = new Date();

    const actuacionesNuevas = await this.prisma.actuaciones.findMany({
      where: {
        fechaRegistro: {
          gte: hoy,
          lte: ahora,
        },
      },
      include: {
        procesoJudicial: {
          include: {
            usuarioProceso: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      distinct: ['procesoJuducialId'],
    });

    if (actuacionesNuevas.length === 0) {
      log.info('ℹ️ No hay nuevas actuaciones de primera instancia para notificar.');
      return;
    }

    let totalNotificaciones = 0;
    const radicadosProcesados = new Set<string>();

    for (const actuacion of actuacionesNuevas) {
      if (!actuacion.procesoJudicial || actuacion.procesoJudicial.usuarioProceso.length === 0) {
        continue;
      }

      const radicado = actuacion.procesoJudicial.radicado;
      if (radicadosProcesados.has(radicado)) {
        continue;
      }

      radicadosProcesados.add(radicado);
      const notificaciones = await this.notificarNuevasActuacionesProcesoJudicial(
        radicado,
        actuacion.fechaRegistro || new Date(),
      );
      totalNotificaciones += notificaciones;
    }

    log.info(`📢 Total de notificaciones de primera instancia enviadas: ${totalNotificaciones} para ${radicadosProcesados.size} procesos.`);
  }

  async notificarNuevasActuacionesSegundaInstanciaDelDia() {
    const hoy = dayjs().startOf("day").toDate();
    const ahora = new Date();

    const actuacionesNuevas = await this.prisma.actuacionesSegundaInstancia.findMany({
      where: {
        fechaRegistro: {
          gte: hoy,
          lte: ahora,
        },
      },
      include: {
        segundaInstancia: {
          include: {
            procesoJudicial: {
              include: {
                usuarioProceso: {
                  include: {
                    usuario: true,
                  },
                },
              },
            },
          },
        },
      },
      distinct: ['segundaInstanciaId'],
    });

    if (actuacionesNuevas.length === 0) {
      log.info('ℹ️ No hay nuevas actuaciones de segunda instancia para notificar.');
      return;
    }

    let totalNotificaciones = 0;
    const radicadosProcesados = new Set<string>();

    for (const actuacion of actuacionesNuevas) {
      if (!actuacion.segundaInstancia || actuacion.segundaInstancia.procesoJudicial.usuarioProceso.length === 0) {
        continue;
      }

      const radicado = actuacion.segundaInstancia.radicado;
      if (radicadosProcesados.has(radicado)) {
        continue;
      }

      radicadosProcesados.add(radicado);
      const notificaciones = await this.notificarNuevasActuacionesSegundaInstancia(
        radicado,
        actuacion.fechaRegistro || new Date(),
      );
      totalNotificaciones += notificaciones;
    }

    log.info(`📢 Total de notificaciones de segunda instancia enviadas: ${totalNotificaciones} para ${radicadosProcesados.size} procesos.`);
  }

  private async notificarNuevasActuacionesProcesoJudicial(radicado: string, fecha: Date): Promise<number> {
    const proceso = await this.prisma.procesoJudicial.findFirst({
      where: { radicado },
      include: {
        usuarioProceso: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!proceso || proceso.usuarioProceso.length === 0) {
      return 0;
    }

    const mensaje = actualizacionActuacionesProcesoJudicialMessage(radicado, fecha);
    let notificacionesCreadas = 0;

    for (const usuarioProceso of proceso.usuarioProceso) {
      const existe = await this.notificationExists(
        usuarioProceso.usuarioId,
        NotificacionTipo.ACTUALIZACION_ACTUACIONES_PROCESO_JUDICIAL,
        mensaje.message,
      );

      if (!existe) {
        await this.createNotification({
          usuarioId: usuarioProceso.usuarioId,
          titulo: mensaje.title,
          tipo: mensaje.type,
          mensaje: mensaje.message,
        });
        notificacionesCreadas++;
      }
    }

    return notificacionesCreadas;
  }

  private async notificarNuevasActuacionesSegundaInstancia(radicado: string, fecha: Date): Promise<number> {
    const segundaInstancia = await this.prisma.segundaInstancia.findFirst({
      where: { radicado },
      include: {
        procesoJudicial: {
          include: {
            usuarioProceso: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    if (!segundaInstancia || segundaInstancia.procesoJudicial.usuarioProceso.length === 0) {
      return 0;
    }

    const mensaje = actualizacionActuacionesSegundaInstanciaMessage(radicado, fecha);
    let notificacionesCreadas = 0;

    for (const usuarioProceso of segundaInstancia.procesoJudicial.usuarioProceso) {
      const existe = await this.notificationExists(
        usuarioProceso.usuarioId,
        NotificacionTipo.ACTUALIZACION_ACTUACIONES_SEGUNDA_INSTANCIA,
        mensaje.message,
      );

      if (!existe) {
        await this.createNotification({
          usuarioId: usuarioProceso.usuarioId,
          titulo: mensaje.title,
          tipo: mensaje.type,
          mensaje: mensaje.message,
        });
        notificacionesCreadas++;
      }
    }

    return notificacionesCreadas;
  }
}
