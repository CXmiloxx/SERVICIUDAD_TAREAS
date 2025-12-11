import dayjs from 'dayjs';
import prismaService from './prisma.services';
import { EstadoUsuario } from '@prisma/client';
import { log } from '../utils/formatLog';

export class CronAuthService {
  private prisma = prismaService;

  async inactiveUsersJob() {
    const hoy = dayjs();
    const inicio = hoy.startOf("day").toDate();
    const fin = hoy.endOf("day").toDate();

    const usersToDeactivate = await this.prisma.usuario.findMany({
      where: {
        estado: EstadoUsuario.ACTIVO,
        contrato: {
          fechaFin: {
            gte: inicio,
            lte: fin,
          },
        },
      },
      include: {
        contrato: true
      }
    });

    if (!usersToDeactivate || usersToDeactivate.length === 0) {
      log.info('🔍 No hay usuarios para inactivar en el día de hoy.');
      return;
    }

    usersToDeactivate.forEach(user => {
      log.info(`📋 Contrato vencido => Usuario: ${user.nombre} ${user.apellido}`);
    });

    await this.prisma.usuario.updateMany({
      where: {
        estado: EstadoUsuario.ACTIVO,
        contrato: {
          fechaFin: { gte: inicio, lte: fin },
        },
      },
      data: { estado: EstadoUsuario.INACTIVO },
    });

    log.success(`✅ Inactivación de usuarios completada. ${usersToDeactivate.length} usuarios inactivados.`);
  }
}
