import prismaService from './prisma.services';
import { Actuations } from '../types/judicialBranch.types';
import { JudicialBranchServices } from './judicialBranch.services';

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

    const BATCH_SIZE = 20; // Número de procesos por tanda
    const totalTandas = Math.ceil(procesos.length / BATCH_SIZE);
    const todosResultados: Array<{ radicado: string; insertadas: number }> = [];

    for (let i = 0; i < procesos.length; i += BATCH_SIZE) {
      const batch = procesos.slice(i, i + BATCH_SIZE);
      const tandaActual = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`\n🕒 Ejecutando tanda ${tandaActual} de ${totalTandas}...`);
      console.time(`⏳ Tiempo de tanda ${tandaActual}`);

      const resultados = await Promise.all(
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
              return null;
            }

            const insertadas = await this.sincronizarActuaciones(radicado, actuaciones, id);
            return { radicado, insertadas };
          } catch (error: any) {
            console.error(`⚠️ Error en ${radicado}: ${error.message}`);
            return null;
          }
        }),
      );

      const resultadosFiltrados = resultados.filter((r): r is { radicado: string; insertadas: number } => r !== null);
      todosResultados.push(...resultadosFiltrados);

      console.timeEnd(`⏳ Tiempo de tanda ${tandaActual}`);
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

    const BATCH_SIZE = 20;
    const totalTandas = Math.ceil(segundasInstancias.length / BATCH_SIZE);
    const todosResultados: Array<{ radicado: string; insertadas: number }> = [];

    for (let i = 0; i < segundasInstancias.length; i += BATCH_SIZE) {
      const batch = segundasInstancias.slice(i, i + BATCH_SIZE);
      const tandaActual = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`\n🕒 Ejecutando tanda ${tandaActual} de ${totalTandas} (Segunda Instancia)...`);
      console.time(`⏳ Tiempo de tanda ${tandaActual} (Segunda Instancia)`);

      const resultados = await Promise.all(
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
              return null;
            }

            const insertadas = await this.sincronizarActuacionesSegundaInstancia(
              radicado,
              actuaciones,
              id,
            );
            return { radicado, insertadas };
          } catch (error: any) {
            console.error(`⚠️ Error en segunda instancia ${radicado}: ${error.message}`);
            return null;
          }
        }),
      );

      const resultadosFiltrados = resultados.filter((r): r is { radicado: string; insertadas: number } => r !== null);
      todosResultados.push(...resultadosFiltrados);

      console.timeEnd(`⏳ Tiempo de tanda ${tandaActual} (Segunda Instancia)`);
    }

    console.log('\n✅ Tarea automática completada.');
    return todosResultados;
  }
}
