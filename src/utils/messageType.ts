import { NotificacionTipo, Secretaria, Usuario } from "@prisma/client";
import dayjs from "dayjs";

export function contratoExpirandoMessage(usuario: Usuario, fechaFin: Date, secretaria?: Secretaria) {
  const title = '¡Atención: Contrato por vencer!';
  const type = NotificacionTipo.CONTRATO_EXPIRANDO;
  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
  const fechaFormateada = dayjs(fechaFin).format("DD/MM/YYYY");
  const message = `Te informamos que el contrato de ${nombreCompleto} de la secretaria de ${secretaria.nombre} está próximo a vencer el ${fechaFormateada}.`;
  return { title, type, message, secretaria };
}

export function eventoCalendarioMessage(titulo: string, fecha: Date) {
  const title = '¡Recordatorio de evento en tu calendario!';
  const type = NotificacionTipo.EVENTO_CALENDARIO;
  const fechaFormateada = dayjs(fecha).format("DD/MM/YYYY");
  const message = `Tienes agendado el evento "${titulo}" para el día ${fechaFormateada}.`;
  return { title, type, message };
}

export function actualizacionActuacionesProcesoJudicialMessage(radicado: string, fecha: Date) {
  const title = 'Nuevas actuaciones en tu proceso judicial';
  const type = NotificacionTipo.ACTUALIZACION_ACTUACIONES_PROCESO_JUDICIAL;
  const fechaFormateada = dayjs(fecha).format("DD/MM/YYYY");
  const message = `Se han registrado nuevas actuaciones en el proceso judicial con radicado ${radicado} el día ${fechaFormateada}. Te recomendamos consultar el detalle para estar al tanto de los avances.`;
  return { title, type, message };
}

export function actualizacionActuacionesSegundaInstanciaMessage(radicado: string, fecha: Date) {
  const title = 'Novedades en segunda instancia de tu proceso';
  const type = NotificacionTipo.ACTUALIZACION_ACTUACIONES_SEGUNDA_INSTANCIA;
  const fechaFormateada = dayjs(fecha).format("DD/MM/YYYY");
  const message = `Se detectaron nuevas actuaciones en la segunda instancia del proceso judicial con radicado ${radicado}, registradas el ${fechaFormateada}. Consulta los detalles y prepara tus próximos pasos.`;
  return { title, type, message };
}