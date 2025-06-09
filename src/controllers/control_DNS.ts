// tareasProgramadas.ts

import { Request, Response, Router } from "express"; // Asegúrate de importar Request y Response si aún no lo has hecho
import { pool } from "../db";
import { RowDataPacket } from "mysql2";
import axios from "axios";
import { NOTIFICATION_API, API_SERVER, ADMIN_API, API_CLUDFLARE_DNS } from "../config";
import moment from "moment-timezone";
import mysql from "mysql2/promise";




const apiURL_notificar = NOTIFICATION_API;

const apiURL_server = API_SERVER;

const apiURL_panel = ADMIN_API;

const API_TOKEN = API_CLUDFLARE_DNS;




export const Actualizar_DNS = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "Actualizar DNS";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  const { exec } = await import("child_process");
  const util = await import("util");
  const ping = util.promisify(exec);

  const IP_PRINCIPAL = "201.236.243.161";
  const IP_SECUNDARIA = "181.62.138.185";



  const DOMINIOS = [
    // autolin.com.co
    "otro.autolin.com.co",
    "app.autolin.com.co",
    "admin.autolin.com.co",
    "server.autolin.com.co",
    "autolin.com.co",
    // //migracionhelp.com
    "migracionhelp.com",
    // //  rentacargomez.com
    "rentacargomez.com",
    // finova.com.co
    "finova.com.co",
    "gobernacion.finova.com.co",
    "apigober.finova.com.co",
    "decevalproxy.finova.com.co",
    "pasarelagou.finova.com.co",
    "facilcreditowbot.finova.com.co",
    "facilcreditosbot.finova.com.co",
    "app.finova.com.co",
    "server.finova.com.co",
    "admin.finova.com.co",
    "notificar.finova.com.co",
    "panel.finova.com.co",
    "pago.finova.com.co",
    "despacho.finova.com.co",
    "whatsappapi.finova.com.co",
    "whatsappbot.finova.com.co",
    "pagare.finova.com.co",
    "panini.finova.com.co",
    "apipanini.finova.com.co",
    "hablamepanini.finova.com.co",
    "pagopanini.finova.com.co",
    "tareapanini.finova.com.co",
    "avvillas.finova.com.co",
    //goldraea.com
    "goldraea.com",
    // "app.goldraea.com",
    // "licance.goldraea.com",
    // "pago.goldraea.com",
    // "server.goldraea.com",
    // "vps.goldraea.com",
    // "pago.goldraea.com",

  
  ];

  const HEADERS = {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  };

  const obtenerFechaHora = (): string => {
    return moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");
  };

  // Obtiene zone ID para un dominio
  const obtenerZoneId = async (dominio: string): Promise<string | null> => {
    const parts = dominio.split(".");
    let zoneName = parts.length > 2 ? parts.slice(parts.length - 3).join(".") : dominio;
    const url = `https://api.cloudflare.com/client/v4/zones?name=${zoneName}`;
    const { data } = await axios.get(url, { headers: HEADERS });
    return data.result?.[0]?.id || null;
  };

  // Obtiene el record ID y la IP actual
  let ipActual: string | null = null;

  const obtenerRecordId = async (zoneId: string, dominio: string): Promise<string | null> => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${dominio}&type=A`;
    const { data } = await axios.get(url, { headers: HEADERS });
    ipActual = data.result?.[0]?.content || null;  // Almacena la IP actual del dominio
    return data.result?.[0]?.id || null;
  };

  // Verificar si la IP está activa usando HTTP
  const verificarConexionHttp = async (ip: string): Promise<boolean> => {
    const url = `http://${ip}`;  // O usa https:// si el servidor es HTTPS
    try {
      const response = await axios.get(url, { timeout: 5000 });  // Timeout de 5 segundos
      if (response.status === 200) {
        console.log(`Conexión exitosa con ${ip}`);
        return true;  // La IP está activa
      }
    } catch (error) {
      console.error(`Error al conectar con la IP: ${ip}`);
    }
    return false;  // La IP no está activa
  };

  const actualizarRegistroDNS = async (
    zoneId: string,
    dominio: string,
    ip: string,
    recordId: string
  ): Promise<void> => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`;
    const payload = {
      type: "A",
      name: dominio,
      content: ip,
      ttl: 300,
      proxied: false, // Se puede ajustar según tus necesidades
    };

    const { data } = await axios.put(url, payload, { headers: HEADERS });

    if (data.success) {
      console.log(`${obtenerFechaHora()} - ✅ DNS actualizado: ${dominio} -> ${ip}`);
    } else {
      console.error(`${obtenerFechaHora()} - ❌ Error al actualizar ${dominio}:`, data.errors);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log("-----------------------------------------------------------------");
  console.log(`${obtenerFechaHora()} - Iniciando actualización de DNS...`);

  for (const dominio of DOMINIOS) {
    console.log(`${obtenerFechaHora()} - Procesando dominio: ${dominio}`);
    try {
      const zoneId = await obtenerZoneId(dominio);
      if (!zoneId) {
        console.error(`${obtenerFechaHora()} - ❌ No se pudo obtener el Zone ID para ${dominio}`);
        continue;
      }

      const recordId = await obtenerRecordId(zoneId, dominio);
      if (!recordId) {
        console.error(`${obtenerFechaHora()} - ❌ No se pudo obtener el ID del registro para ${dominio}`);
        continue;
      }

      console.log("IP actual asociada al dominio:", ipActual);

      if (!ipActual) {
        console.error(`${obtenerFechaHora()} - ❌ No se pudo obtener la IP actual para ${dominio}`);
        continue;
      }

      // Verificar si la IP actual está activa
      const ipDisponible = await verificarConexionHttp(ipActual)
        ? ipActual
        : await verificarConexionHttp(IP_PRINCIPAL)
        ? IP_PRINCIPAL
        : IP_SECUNDARIA;

      console.log(`${obtenerFechaHora()} - Usando IP: ${ipDisponible}`);

      // Actualizar el DNS solo si la IP está activa
      await actualizarRegistroDNS(zoneId, dominio, ipDisponible, recordId);

      // Pausa entre dominios por seguridad
      await sleep(500);
    } catch (error: any) {
      console.error(`${obtenerFechaHora()} - ❌ Error procesando ${dominio}:`, error.message);
    }
  }

  console.log(`${obtenerFechaHora()} - ✅ Finalizó actualización DNS.`);
  console.log("-----------------------------------------------------------------");

  // Responder al cliente
  res.status(200).json({ mensaje: "Tarea ejecutada correctamente para todos los dominios." });
};

const obtenerFechaHoraBogota = (): { fecha: string; hora: string } => {
  // Obtener la fecha y hora actual en la zona horaria de Bogotá
  const fechaHoraBogota = moment().tz("America/Bogota");

  // Formatear la fecha y la hora
  const fecha = fechaHoraBogota.format("YYYY-MM-DD"); // Fecha en formato YYYY-MM-DD
  const hora = fechaHoraBogota.format("HH:mm"); // Hora en formato HH:mm

  return { fecha, hora };
};




const validarEInsertarTarea = async (tarea: string): Promise<boolean> => {
  try {
    // Obtener la fecha ajustada a la zona horaria de Bogotá
    const { fecha, hora } = obtenerFechaHoraBogota();

    console.log("fecha", fecha);
    const tareasPogramadasValidar = `
     SELECT 
       CASE 
         WHEN COUNT(*) > 0 THEN 1 
         ELSE 2 
       END AS result
     FROM tareasprogramadas
     WHERE tarea = ? AND DATE(fecha_registro) = DATE(?);

    `;

    // Ejecutar la consulta de validación
    const [rows] = await pool.query(tareasPogramadasValidar, [tarea, fecha]);
    const result = rows[0].result;

    console.log("tareas", result);

    if (result === 1) {
      // console.log("Ya existe un registro", hora);
      return false; // Indicar que la tarea ya existe
    }

    console.log("proceso de", tarea, " hora:", hora);

    // Si no existe un registro, proceder con la inserción
    const insertSaldoAnteriorQuery = `
      INSERT INTO tareasprogramadas (tarea)
      VALUES (?);
    `;
    await pool.query(insertSaldoAnteriorQuery, [tarea]);

    console.log("Tarea programada insertada con éxito");
    return true; // Indicar que la tarea se insertó correctamente
  } catch (error) {
    console.error("Error al verificar o insertar tarea programada:", error);
    throw new Error("Error en la consulta");
  }
};

// Función de pausa
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { sleep };


