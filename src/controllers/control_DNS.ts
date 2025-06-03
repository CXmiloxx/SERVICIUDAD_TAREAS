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

  // if (!tareaInsertada) {
  //   console.log("Ya existe un registro en:", tareas, fecha, hora);
  //   res.status(200).json({ mensaje: "La tarea ya fue ejecutada recientemente." });
  //   return;
  // }

  const { exec } = await import("child_process");
  const util = await import("util");
  const ping = util.promisify(exec);


  const IP_PRINCIPAL = "201.236.243.161";
  const IP_SECUNDARIA = "201.236.243.161";

  const DOMINIOS = [
    "otro.autolin.com.co",
    "app.autolin.com.co",
    "admin.autolin.com.co",
    "server.autolin.com.co",
    "autolin.com.co",
    "migracionhelp.com",
  ];

  const HEADERS = {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  };

  const obtenerFechaHora = (): string => {
    return moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");
  };

  const verificarPing = async (ip: string): Promise<boolean> => {
    try {
      const { stdout } = await ping(`ping -c 2 -W 2 ${ip}`);
      return stdout.includes("bytes from");
    } catch {
      return false;
    }
  };

  // Obtiene zone ID para un dominio, extrayendo el dominio raíz (zona)
  const obtenerZoneId = async (dominio: string): Promise<string | null> => {
    // Extraemos la zona raíz (ej: autolin.com.co de app.autolin.com.co)
    // Para simplificar, tomamos los últimos dos segmentos para zonas normales (.com.co, .com, .net, etc)
    const parts = dominio.split(".");
    let zoneName = "";
    if (parts.length > 2) {
      zoneName = parts.slice(parts.length - 3).join("."); // para dominios como example.co.uk o autolin.com.co
      // Si quieres un comportamiento más exacto, usa una librería de dominio público suffixes (pero aquí es simple)
    } else {
      zoneName = dominio;
    }
    const url = `https://api.cloudflare.com/client/v4/zones?name=${zoneName}`;
    const { data } = await axios.get(url, { headers: HEADERS });
    return data.result?.[0]?.id || null;
  };

  const obtenerRecordId = async (zoneId: string, dominio: string): Promise<string | null> => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${dominio}&type=A`;
    const { data } = await axios.get(url, { headers: HEADERS });
    return data.result?.[0]?.id || null;
  };

  const obtenerProxied = async (zoneId: string, recordId: string): Promise<boolean | null> => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`;
    const { data } = await axios.get(url, { headers: HEADERS });
    return data.result?.proxied ?? null;
  };

  const actualizarRegistroDNS = async (
    zoneId: string,
    dominio: string,
    ip: string,
    recordId: string,
    proxied: boolean
  ): Promise<void> => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`;
    const payload = {
      type: "A",
      name: dominio,
      content: ip,
      ttl: 300,
      proxied,
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

      const proxied = await obtenerProxied(zoneId, recordId);
      if (proxied === null) {
        console.error(`${obtenerFechaHora()} - ❌ No se pudo obtener el estado 'proxied' para ${dominio}`);
        continue;
      }

      const ipDisponible = (await verificarPing(IP_PRINCIPAL)) ? IP_PRINCIPAL : IP_SECUNDARIA;

      console.log(`${obtenerFechaHora()} - Usando IP: ${ipDisponible}`);
      await actualizarRegistroDNS(zoneId, dominio, ipDisponible, recordId, proxied);

      // Pausa entre dominios por seguridad
      await sleep(500);
    } catch (error: any) {
      console.error(`${obtenerFechaHora()} - ❌ Error procesando ${dominio}:`, error.message);
    }
  }

  console.log(`${obtenerFechaHora()} - ✅ Finalizó actualización DNS.`);
  console.log("-----------------------------------------------------------------");

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
