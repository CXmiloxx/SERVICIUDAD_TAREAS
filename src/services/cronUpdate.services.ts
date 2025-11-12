import prismaService from './prisma.services';
import { Actuations } from '../types/judicialBranch.types';
import { JudicialBranchServices } from './judicialBranch.services';

export class CronUpdateService {
  private prisma = prismaService;
  ramaJudicial = new JudicialBranchServices();

  /**
   * Inserta o actualiza actuaciones en la base de datos para un numero de radicado específico.
   */
  private async sincronizarActuaciones(
    nroRadicado: string,
    actuaciones: Actuations[],
    idProceso,
  ) {
    let insertadas = 0;
    let actualizadas = 0;

    // Recorre cada actuación para insertar nueva o actualizar si ya existe
    for (const act of actuaciones) {
      // Busca si la actuación ya existe (por nroRadicado, fechaActuacion y nombre de actuación)
      const existente = await this.prisma.actuaciones.findFirst({
        where: {
          nroRadicado,
          fechaActuacion: new Date(act.fechaActuacion),
          actuacion: act.actuacion,
        },
      });

      if (existente) {
        // Si existe, la actualiza (únicamente anotación y fecha de registro)
        await this.prisma.actuaciones.update({
          where: { id: existente.id },
          data: {
            anotacion: act.anotacion?.slice(0, 500) || '',
            fechaRegistro: new Date(),
            procesoJuducialId: idProceso,
            fechaInicio: new Date(act.fechaInicial),
            fechaFinalizado: new Date(act.fechaFinal),
            fechaNovedad: new Date(act.fechaActuacion),
          },
        });
        actualizadas++;
      } else {
        // Si no existe, la crea/insertar en la base de datos
        await this.prisma.actuaciones.create({
          data: {
            nroRadicado,
            fechaActuacion: new Date(act.fechaActuacion),
            actuacion: act.actuacion,
            anotacion: act.anotacion?.slice(0, 500) || '',
            fechaRegistro: new Date(),
            procesoJuducialId: idProceso,
            fechaInicio: new Date(act.fechaInicial),
            fechaFinalizado: new Date(act.fechaFinal),
            fechaNovedad: new Date(act.fechaActuacion),
          },
        });
        insertadas++;
      }
    }

    // Muestra un resumen de la sincronización para ese radicado
    console.log(
      `✔ ${nroRadicado}: ${insertadas} insertadas, ${actualizadas} actualizadas.`,
    );
  }

  /**
   * Obtiene todos los radicados guardados consulta nuevas actuaciones y sincroniza en la base de datos.
   */
  async ejecutarActualizacion() {
    console.log('🚀 Iniciando tarea automática de actualización judicial...');

    const procesos = await this.prisma.procesoJudicial.findMany({
      select: { radicado: true, id: true },
    });

    const BATCH_SIZE = 20;0 // Número de procesos por tanda
    const totalTandas = Math.ceil(procesos.length / BATCH_SIZE);

    for (let i = 0; i < procesos.length; i += BATCH_SIZE) {
      const batch = procesos.slice(i, i + BATCH_SIZE);
      const tandaActual = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`\n🕒 Ejecutando tanda ${tandaActual} de ${totalTandas}...`);
      console.time(`⏳ Tiempo de tanda ${tandaActual}`);

      await Promise.all(
        batch.map(async ({ radicado, id }) => {
          try {
            const idProceso = await this.ramaJudicial.obtenerIdProceso(
              radicado,
            );
            const actuaciones = await this.ramaJudicial.obtenerActuaciones(
              idProceso,
            );

            if (!Array.isArray(actuaciones) || actuaciones.length === 0) {
              console.warn(`⚠️ No se encontraron actuaciones para ${radicado}`);
              return;
            }

            await this.sincronizarActuaciones(radicado, actuaciones, id);
          } catch (error: any) {
            console.error(`⚠️ Error en ${radicado}: ${error.message}`);
          }
        }),
      );

      console.timeEnd(`⏳ Tiempo de tanda ${tandaActual}`);
    }

    console.log('\n✅ Tarea automática completada.');
  }
}
