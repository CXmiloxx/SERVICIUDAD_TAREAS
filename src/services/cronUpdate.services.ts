import prismaService from './prisma.services';
import { Actuations } from '../types/judicialBranch.types';
import { JudicialBranchServices } from './judicialBranch.services';

export class CronUpdateService {
  private prisma = prismaService;
  ramaJudicial = new JudicialBranchServices();

  /**
   * Compara dos fechas ignorando milisegundos
   */
  private compararFechas(fecha1: Date | null, fecha2: Date | null): boolean {
    if (!fecha1 && !fecha2) return true;
    if (!fecha1 || !fecha2) return false;
    return fecha1.getTime() === fecha2.getTime();
  }

  /**
   * Verifica si una actuación es idéntica a la existente
   */
  private esActuacionIdentica(
    existente: any,
    nueva: Actuations,
    nroRadicado: string,
  ): boolean {
    const nuevaAnotacion = nueva.anotacion?.slice(0, 500) || '';
    const nuevaFechaActuacion = new Date(nueva.fechaActuacion);
    const nuevaFechaInicio = nueva.fechaInicial
      ? new Date(nueva.fechaInicial)
      : null;
    const nuevaFechaFinal = nueva.fechaFinal
      ? new Date(nueva.fechaFinal)
      : null;

    return (
      existente.nroRadicado === nroRadicado &&
      this.compararFechas(
        existente.fechaActuacion,
        nuevaFechaActuacion,
      ) &&
      existente.actuacion === nueva.actuacion &&
      existente.anotacion === nuevaAnotacion &&
      this.compararFechas(existente.fechaInicio, nuevaFechaInicio) &&
      this.compararFechas(existente.fechaFinalizado, nuevaFechaFinal)
    );
  }


  /**
   * Inserta actuaciones nuevas en la base de datos para un numero de radicado específico.
   * Solo guarda registros que no existen o que tienen información diferente.
   */
  private async sincronizarActuaciones(
    nroRadicado: string,
    actuaciones: Actuations[],
    idProceso: number,
  ) {
    let insertadas = 0;
    let omitidas = 0;

    for (const act of actuaciones) {
      const fechaActuacion = new Date(act.fechaActuacion);
      const fechaInicio = act.fechaInicial ? new Date(act.fechaInicial) : null;
      const fechaFinal = act.fechaFinal ? new Date(act.fechaFinal) : null;
      const anotacion = act.anotacion?.slice(0, 500) || '';

      const existente = await this.prisma.actuaciones.findFirst({
        where: {
          nroRadicado,
          fechaActuacion,
          actuacion: act.actuacion,
          procesoJuducialId: idProceso,
        },
      });

      if (existente) {
        if (this.esActuacionIdentica(existente, act, nroRadicado)) {
          omitidas++;
          continue;
        }
      }

      await this.prisma.actuaciones.create({
        data: {
          nroRadicado,
          fechaActuacion,
          actuacion: act.actuacion,
          anotacion,
          fechaRegistro: new Date(),
          procesoJuducialId: idProceso,
          fechaInicio,
          fechaFinalizado: fechaFinal,
          fechaNovedad: fechaActuacion,
        },
      });
      insertadas++;
    }

    console.log(
      `✔ ${nroRadicado}: ${insertadas} insertadas, ${omitidas} omitidas (ya existían).`,
    );
  }

  /**
   * Inserta actuaciones nuevas de segunda instancia en la base de datos.
   * Solo guarda registros que no existen o que tienen información diferente.
   */
  private async sincronizarActuacionesSegundaInstancia(
    nroRadicado: string,
    actuaciones: Actuations[],
    idSegundaInstancia: number,
  ) {
    let insertadas = 0;
    let omitidas = 0;

    for (const act of actuaciones) {
      const fechaActuacion = new Date(act.fechaActuacion);
      const fechaInicio = act.fechaInicial ? new Date(act.fechaInicial) : null;
      const fechaFinal = act.fechaFinal ? new Date(act.fechaFinal) : null;
      const anotacion = act.anotacion?.slice(0, 500) || '';

      const existente = await this.prisma.actuacionesSegundaInstancia.findFirst({
        where: {
          nroRadicado,
          fechaActuacion,
          actuacion: act.actuacion,
          segundaInstanciaId: idSegundaInstancia,
        },
      });

      if (existente) {
        if (this.esActuacionIdentica(existente, act, nroRadicado)) {
          omitidas++;
          continue;
        }
      }

      await this.prisma.actuacionesSegundaInstancia.create({
        data: {
          nroRadicado,
          fechaActuacion,
          actuacion: act.actuacion,
          anotacion,
          fechaRegistro: new Date(),
          segundaInstanciaId: idSegundaInstancia,
          fechaInicio,
          fechaFinalizado: fechaFinal,
          fechaNovedad: fechaActuacion,
        },
      });
      insertadas++;
    }

    console.log(
      `✔ Segunda Instancia ${nroRadicado}: ${insertadas} insertadas, ${omitidas} omitidas (ya existían).`,
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

    const BATCH_SIZE = 20; // Número de procesos por tanda
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
  }

  /**
   * Obtiene todos los registros de segunda instancia y sincroniza sus actuaciones.
   */
  async ejecutarActualizacionSegundaInstancia() {
    console.log('\n🚀 Iniciando actualización de segunda instancia...');

    const segundasInstancias = await this.prisma.segundaInstancia.findMany({
      select: { radicado: true, id: true },
    });

    if (segundasInstancias.length === 0) {
      console.log('ℹ️ No hay registros de segunda instancia para actualizar.');
      return;
    }

    const BATCH_SIZE = 20;
    const totalTandas = Math.ceil(segundasInstancias.length / BATCH_SIZE);

    for (let i = 0; i < segundasInstancias.length; i += BATCH_SIZE) {
      const batch = segundasInstancias.slice(i, i + BATCH_SIZE);
      const tandaActual = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`\n🕒 Ejecutando tanda ${tandaActual} de ${totalTandas} (Segunda Instancia)...`);
      console.time(`⏳ Tiempo de tanda ${tandaActual} (Segunda Instancia)`);

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
              console.warn(`⚠️ No se encontraron actuaciones para segunda instancia ${radicado}`);
              return;
            }

            await this.sincronizarActuacionesSegundaInstancia(
              radicado,
              actuaciones,
              id,
            );
          } catch (error: any) {
            console.error(`⚠️ Error en segunda instancia ${radicado}: ${error.message}`);
          }
        }),
      );

      console.timeEnd(`⏳ Tiempo de tanda ${tandaActual} (Segunda Instancia)`);
    }

    console.log('\n✅ Tarea automática completada.');
  }
}
