import { Actuaciones } from '@prisma/client';
import { actuacionesData } from '../types/ramaJudicial.types';
import prismaService from './prisma.services';

export class ProceedingsServices {
  private prisma = prismaService;

  constructor() {}


  async ProcessProceedings(
    actuaciones: actuacionesData[],
    numeroRadicado: string,
    procesoJuducialId?: number,
  ) {
    let insertadas = 0;
    let actualizadas = 0;
    let omitidas = 0;
    const MAX_ANOTACION_LENGTH = 500;

    const actuacionesProcesadas: Actuaciones[] = [];

    // Si no llega información para insertar, retornar información guardada en base de datos
    if (!actuaciones || actuaciones.length === 0) {
      const actuacionesDb = await this.prisma.actuaciones.findMany({
        where: {
          nroRadicado: numeroRadicado,
        },
      });

      if (!actuacionesDb || actuacionesDb.length === 0) {
        throw new Error("No hay actuaciones con ese numero de radicado en el sistema")
      }
      return {
        insertadas: 0,
        actualizadas: 0,
        omitidas: 0,
        actuacionesProcesadas: actuacionesDb,
      };
    }

    for (const actuacion of actuaciones) {
      const {
        fechaActuacion,
        actuacion: tipoActuacion,
        anotacion,
        fechaInicial,
        fechaFinal,
        fechaRegistro,
      } = actuacion;

      if (!tipoActuacion || tipoActuacion.trim() === '') {
        omitidas++;
        continue;
      }

      const fecha_actuacion = new Date(fechaActuacion ?? '');
      const fecha_inicio = fechaInicial ? new Date(fechaInicial) : undefined;
      const fecha_finalizado = fechaFinal ? new Date(fechaFinal) : undefined;
      const fecha_novedad = fechaRegistro ? new Date(fechaRegistro) : undefined;

      let anotacion_limitada = anotacion || '';

      if (anotacion_limitada.length > MAX_ANOTACION_LENGTH) {
        anotacion_limitada = anotacion_limitada.slice(0, MAX_ANOTACION_LENGTH);
      }

      try {
        const existente = await this.prisma.actuaciones.findFirst({
          where: {
            nroRadicado: numeroRadicado,
            fechaActuacion: fecha_actuacion,
            actuacion: tipoActuacion,
          },
        });

        let actuacionProcesada;

        if (existente) {
          actuacionProcesada = await this.prisma.actuaciones.update({
            where: { id: existente.id },
            data: {
              anotacion: anotacion_limitada,
              fechaInicio: fecha_inicio,
              fechaFinalizado: fecha_finalizado,
              fechaNovedad: fecha_novedad,
              fechaRegistro: new Date(),
              ...(procesoJuducialId && {
                procesoJudicial: { connect: { id: procesoJuducialId } },
              }),
            },
          });
          actualizadas++;
        } else {
          actuacionProcesada = await this.prisma.actuaciones.create({
            data: {
              nroRadicado: numeroRadicado,
              fechaActuacion: fechaActuacion
                ? new Date(fechaActuacion).toISOString()
                : '',
              actuacion: tipoActuacion,
              anotacion: anotacion_limitada,
              fechaInicio: fecha_inicio,
              fechaFinalizado: fecha_finalizado,
              fechaNovedad: fecha_novedad,
              fechaRegistro: new Date(),
              ...(procesoJuducialId && {
                procesoJudicial: { connect: { id: procesoJuducialId } },
              }),
            },
          });
          insertadas++;
        }

        // se guardan todas las  actuación procesadas
        actuacionesProcesadas.push(actuacionProcesada);
      } catch (err: any) {
        console.error(
          `Error al procesar actuación ${tipoActuacion}:`,
          err.message,
        );
        omitidas++;
      }
    }

    return {
      insertadas,
      actualizadas,
      omitidas,
      actuacionesProcesadas,
    };
  }
}
