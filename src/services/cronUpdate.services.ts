import prismaService from './prisma.services';
import { Actuations } from '../types/judicialBranch.types';
import { JudicialBranchServices } from './judicialBranch.services';
import { rateLimitingConfig } from '../config/rateLimiting.config';

export class CronUpdateService {
  private prisma = prismaService;
  ramaJudicial = new JudicialBranchServices();

  // Normaliza una fecha para comparación (ignora milisegundos)
  private normalizarFecha(fecha: Date): Date {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setMilliseconds(0);
    return fechaNormalizada;
  }


  // Crea una clave única para una actuación
  private crearClaveActuacion(
    nroRadicado: string,
    fechaActuacion: Date,
    actuacion: string,
  ): string {
    const fechaNormalizada = this.normalizarFecha(fechaActuacion);
    return `${nroRadicado}|${fechaNormalizada.toISOString()}|${actuacion}`;
  }

  // Inserta actuaciones nuevas en la base de datos para un numero de radicado específico. Solo guarda registros que no existen.
  private async sincronizarActuaciones(
    nroRadicado: string,
    actuaciones: Actuations[],
    idProceso: number,
  ): Promise<number> {
    let insertadas = 0;
    let omitidas = 0;

    const actuacionesExistentes = await this.prisma.actuaciones.findMany({
      where: {
        nroRadicado,
        procesoJuducialId: idProceso,
      },
      select: {
        fechaActuacion: true,
        actuacion: true,
      },
    });

    const clavesExistentes = new Set(
      actuacionesExistentes.map((a) =>
        this.crearClaveActuacion(nroRadicado, a.fechaActuacion, a.actuacion),
      ),
    );

    for (const act of actuaciones) {
      const fechaActuacion = this.normalizarFecha(new Date(act.fechaActuacion));
      const fechaInicio = act.fechaInicial ? this.normalizarFecha(new Date(act.fechaInicial)) : null;
      const fechaFinal = act.fechaFinal ? this.normalizarFecha(new Date(act.fechaFinal)) : null;
      const anotacion = act.anotacion?.slice(0, 500) || '';

      const clave = this.crearClaveActuacion(nroRadicado, fechaActuacion, act.actuacion);

      if (clavesExistentes.has(clave)) {
        omitidas++;
        continue;
      }

      try {
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
        clavesExistentes.add(clave);
        insertadas++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          omitidas++;
        } else {
          throw error;
        }
      }
    }

    console.log(
      `✔ ${nroRadicado}: ${insertadas} insertadas, ${omitidas} omitidas (ya existían).`,
    );

    return insertadas;
  }

  // Inserta actuaciones nuevas de segunda instancia en la base de datos. Solo guarda registros que no existen.
  private async sincronizarActuacionesSegundaInstancia(
    nroRadicado: string,
    actuaciones: Actuations[],
    idSegundaInstancia: number,
  ): Promise<number> {
    let insertadas = 0;
    let omitidas = 0;

    const actuacionesExistentes = await this.prisma.actuacionesSegundaInstancia.findMany({
      where: {
        nroRadicado,
        segundaInstanciaId: idSegundaInstancia,
      },
      select: {
        fechaActuacion: true,
        actuacion: true,
      },
    });

    const clavesExistentes = new Set(
      actuacionesExistentes.map((a) =>
        this.crearClaveActuacion(nroRadicado, a.fechaActuacion, a.actuacion),
      ),
    );

    for (const act of actuaciones) {
      const fechaActuacion = this.normalizarFecha(new Date(act.fechaActuacion));
      const fechaInicio = act.fechaInicial ? this.normalizarFecha(new Date(act.fechaInicial)) : null;
      const fechaFinal = act.fechaFinal ? this.normalizarFecha(new Date(act.fechaFinal)) : null;
      const anotacion = act.anotacion?.slice(0, 500) || '';

      const clave = this.crearClaveActuacion(nroRadicado, fechaActuacion, act.actuacion);

      if (clavesExistentes.has(clave)) {
        omitidas++;
        continue;
      }

      try {
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
        clavesExistentes.add(clave);
        insertadas++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          omitidas++;
        } else {
          throw error;
        }
      }
    }

    console.log(
      `✔ Segunda Instancia ${nroRadicado}: ${insertadas} insertadas, ${omitidas} omitidas (ya existían).`,
    );

    return insertadas;
  }

  /**
   * Obtiene todos los radicados guardados consulta nuevas actuaciones y sincroniza en la base de datos.
   */
  async ejecutarActualizacion(): Promise<Array<{ radicado: string; insertadas: number }>> {
    console.log('🚀 Iniciando tarea automática de actualización judicial...');

    const procesos = await this.prisma.procesoJudicial.findMany({
      select: { radicado: true, id: true },
    });

    const totalTandas = Math.ceil(procesos.length / rateLimitingConfig.batchSize);
    const todosResultados: Array<{ radicado: string; insertadas: number }> = [];
    let erroresConsecutivos = 0;

    for (let i = 0; i < procesos.length; i += rateLimitingConfig.batchSize) {
      const batch = procesos.slice(i, i + rateLimitingConfig.batchSize);
      const tandaActual = Math.floor(i / rateLimitingConfig.batchSize) + 1;

      console.log(`\n🕒 Ejecutando tanda ${tandaActual} de ${totalTandas}...`);
      console.time(`⏳ Tiempo de tanda ${tandaActual}`);

      const resultados: Array<{ radicado: string; insertadas: number } | null> = [];

      for (const { radicado, id } of batch) {
        try {
          await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.delayBetweenRequests));

          const idProceso = await this.ramaJudicial.obtenerIdProceso(radicado);
          const actuaciones = await this.ramaJudicial.obtenerActuaciones(idProceso);

          if (!Array.isArray(actuaciones) || actuaciones.length === 0) {
            resultados.push(null);
            continue;
          }

          const insertadas = await this.sincronizarActuaciones(radicado, actuaciones, id);
          resultados.push({ radicado, insertadas });
          erroresConsecutivos = 0;
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 403 || status === 429) {
            erroresConsecutivos++;
            console.error(`⚠️ Error ${status} en ${radicado} (${erroresConsecutivos}/${rateLimitingConfig.maxConsecutiveErrors})`);

            if (erroresConsecutivos >= rateLimitingConfig.maxConsecutiveErrors) {
              console.error(`🛑 Demasiados errores consecutivos. Pausando ${rateLimitingConfig.pauseOnMaxErrors}ms...`);
              await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.pauseOnMaxErrors));
              erroresConsecutivos = 0;
            }
          } else {
            console.error(`⚠️ Error en ${radicado}: ${error.message}`);
          }
          resultados.push(null);
        }
      }

      const resultadosFiltrados = resultados.filter((r): r is { radicado: string; insertadas: number } => r !== null);
      todosResultados.push(...resultadosFiltrados);

      console.timeEnd(`⏳ Tiempo de tanda ${tandaActual}`);

      if (tandaActual < totalTandas) {
        console.log(`⏸️ Pausa entre tandas: ${rateLimitingConfig.delayBetweenBatches}ms`);
        await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.delayBetweenBatches));
      }
    }

    return todosResultados;
  }

  /**
   * Obtiene todos los registros de segunda instancia y sincroniza sus actuaciones.
   */
  async ejecutarActualizacionSegundaInstancia(): Promise<Array<{ radicado: string; insertadas: number }>> {
    console.log('\n🚀 Iniciando actualización de segunda instancia...');

    const segundasInstancias = await this.prisma.segundaInstancia.findMany({
      select: { radicado: true, id: true },
    });

    if (segundasInstancias.length === 0) {
      console.log('ℹ️ No hay registros de segunda instancia para actualizar.');
      return [];
    }

    const totalTandas = Math.ceil(segundasInstancias.length / rateLimitingConfig.batchSize);
    const todosResultados: Array<{ radicado: string; insertadas: number }> = [];
    let erroresConsecutivos = 0;

    for (let i = 0; i < segundasInstancias.length; i += rateLimitingConfig.batchSize) {
      const batch = segundasInstancias.slice(i, i + rateLimitingConfig.batchSize);
      const tandaActual = Math.floor(i / rateLimitingConfig.batchSize) + 1;

      console.log(`\n🕒 Ejecutando tanda ${tandaActual} de ${totalTandas} (Segunda Instancia)...`);
      console.time(`⏳ Tiempo de tanda ${tandaActual} (Segunda Instancia)`);

      const resultados: Array<{ radicado: string; insertadas: number } | null> = [];

      for (const { radicado, id } of batch) {
        try {
          await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.delayBetweenRequests));

          const idProceso = await this.ramaJudicial.obtenerIdProceso(radicado);
          const actuaciones = await this.ramaJudicial.obtenerActuaciones(idProceso);

          if (!Array.isArray(actuaciones) || actuaciones.length === 0) {
            resultados.push(null);
            continue;
          }

          const insertadas = await this.sincronizarActuacionesSegundaInstancia(radicado, actuaciones, id);
          resultados.push({ radicado, insertadas });
          erroresConsecutivos = 0;
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 403 || status === 429) {
            erroresConsecutivos++;
            console.error(`⚠️ Error ${status} en segunda instancia ${radicado} (${erroresConsecutivos}/${rateLimitingConfig.maxConsecutiveErrors})`);

            if (erroresConsecutivos >= rateLimitingConfig.maxConsecutiveErrors) {
              console.error(`🛑 Demasiados errores consecutivos. Pausando ${rateLimitingConfig.pauseOnMaxErrors}ms...`);
              await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.pauseOnMaxErrors));
              erroresConsecutivos = 0;
            }
          } else {
            console.error(`⚠️ Error en segunda instancia ${radicado}: ${error.message}`);
          }
          resultados.push(null);
        }
      }

      const resultadosFiltrados = resultados.filter((r): r is { radicado: string; insertadas: number } => r !== null);
      todosResultados.push(...resultadosFiltrados);

      console.timeEnd(`⏳ Tiempo de tanda ${tandaActual} (Segunda Instancia)`);

      if (tandaActual < totalTandas) {
        console.log(`⏸️ Pausa entre tandas: ${rateLimitingConfig.delayBetweenBatches}ms`);
        await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.delayBetweenBatches));
      }
    }

    console.log('\n✅ Tarea automática completada.');
    return todosResultados;
  }
}
