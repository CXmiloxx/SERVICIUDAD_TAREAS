import { Request, Response } from "express";
import { pool } from "../db";
import { OkPacket, RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import * as path from "path";
import * as fs from "fs/promises";
import { promises as fsPromises } from "fs";
import axios from "axios";
import { API_SERVER, ADMIN_API } from "../config";

const apiURL_server = API_SERVER;

const apiURL_panel = ADMIN_API;

// Proceso de actualización de pago en amortizador y historial
export const CalcularSanciones = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const estadosPermitidos = [
      "EN PROCESO",
      "EN CURSO",
      "PREJURIDICO",
      "JURIDICO",
      "CASTIGADO",
    ];

    const pageSize = 1000;
    let offset = 0;
    let totalRegistrosActualizados = 0;

    while (true) {
      const creditosQuery = `
        SELECT * FROM detalle_credito
        WHERE estado IN (?)
        ORDER BY fecha_pago ASC
        LIMIT ? OFFSET ?
      `;

      const [creditos] = await pool.query<RowDataPacket[]>(creditosQuery, [
        estadosPermitidos,
        pageSize,
        offset,
      ]);

      if (creditos.length === 0) {
        // No hay más resultados, salir del bucle
        break;
      }

      // Obtener las amortizaciones para cada crédito
      await Promise.all(
        creditos.map(async (credito) => {
          const prestamoID = credito.prestamo_ID;

          const amortizacionQuery = `
            SELECT * FROM amortizacion
            WHERE prestamoID = ?
            ORDER BY fecha_pago ASC
          `;

          const [amortizacion] = await pool.query<RowDataPacket[]>(
            amortizacionQuery,
            [prestamoID]
          );

          // Calcular sanciones para cuotas vencidas
          await Promise.all(
            amortizacion.map(async (cuota) => {
              const fechaCuota = new Date(cuota.fecha_pago);
              const fechaActual: Date = new Date();

              // Verificar si la cuota está vencida
              if (fechaCuota < fechaActual) {
                const diasMora = Math.floor(
                  (fechaActual.getTime() - fechaCuota.getTime()) /
                    (1000 * 3600 * 24)
                );

                const capitalInteresAvalSuma =
                  cuota.capital + cuota.interes + cuota.aval;

                const tasaDiaria = credito.tasa / 30 / 100;
                const sancionPorDiasMora = (
                  capitalInteresAvalSuma *
                  tasaDiaria *
                  diasMora
                ).toFixed(0);
                cuota.sancion = parseFloat(sancionPorDiasMora);

                // Actualizar la tabla amortizacion con los nuevos valores
                const updateQuery = `
                  UPDATE amortizacion
                  SET sancion = ?
                  WHERE id = ?
                `;
                await pool.query(updateQuery, [cuota.sancion, cuota.id]);

                totalRegistrosActualizados++;
              }
            })
          );
        })
      );

      // Pausa de 1 segundo después de procesar cada 1000 registros
      if (offset % 1000 === 0) {
        console.log(
          `Procesados ${offset} registros. Pausando por 1 segundo...`
        );
        await sleep(1000);
      }

      offset += pageSize;
    }

    // Devolver la respuesta con el total de registros actualizados
    res.status(200).json({
      success: true,
      totalRegistrosActualizados: totalRegistrosActualizados,
    });
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ success: false, error: "Error en la solicitud" });
  }
};

// Función de pausa
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PlazoCredito = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Consulta para obtener los registros con cupo mayor a 10
    const amortizacionQuery = `
      SELECT * FROM estudios_realizados
      WHERE cupo > 10;
    `;

    // Ejecutar la consulta
    const [amortizacion] = await pool.query<RowDataPacket[]>(amortizacionQuery);

    // Iterar sobre los resultados y actualizar el plazo según las condiciones
    for (const estudio of amortizacion) {
      const updatePlazoQuery = `
        UPDATE estudios_realizados
        SET plazo = 
          CASE
            WHEN cupo <= 400000 THEN 3
            WHEN cupo <= 500000 THEN 4
            WHEN cupo <= 800000 THEN 6
            WHEN cupo <= 1000000 THEN 10
            ELSE 12
          END
        WHERE id = ?;  -- Asegúrate de tener un identificador único para tu tabla (utilicé 'id' como ejemplo)
      `;

      // Ejecutar la actualización para cada registro
      await pool.query<OkPacket>(updatePlazoQuery, [estudio.id]);
    }

    // Responder con los resultados actualizados
    res.status(200).json({ amortizacion });
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
};

export const CreditoAmortizador = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const estadosPermitidos = [
      "EN PROCESO",
      "EN CURSO",
      "PREJURIDICO",
      "JURIDICO",
      "CASTIGADO",
    ];
    const tipoCredito = "CREDITO AMORTIZACION";

    const pageSize = 1000;
    let offset = 0;
    let totalRegistrosActualizados = 0;

    while (true) {
      const creditosQuery = `
        SELECT * FROM detalle_credito
        WHERE tipoCredito = ? AND estado IN (?, ?, ?, ?, ?)
        ORDER BY fecha_pago ASC
        LIMIT ? OFFSET ?
      `;

      const [creditos] = await pool.query<RowDataPacket[]>(creditosQuery, [
        tipoCredito,
        ...estadosPermitidos,
        pageSize,
        offset,
      ]);

      if (creditos.length === 0) {
        // No hay más resultados, salir del bucle
        break;
      }

      // Obtener las amortizaciones para cada crédito
      await Promise.all(
        creditos.map(async (credito) => {
          const prestamoID = credito.prestamo_ID;

          const amortizacionQuery = `
            SELECT * FROM amortizacion
            WHERE prestamoID = ?
            ORDER BY fecha_pago DESC
            LIMIT 1
          `;

          const [ultimaCuota] = await pool.query<RowDataPacket[]>(
            amortizacionQuery,
            [prestamoID]
          );

          if (ultimaCuota.length > 0) {
            const cuotaAnterior = ultimaCuota[0];

            // Validar si la cuota está vencida
            const fechaCuotaAnterior = new Date(cuotaAnterior.fecha_pago);
            const fechaActual: Date = new Date();

            if (fechaCuotaAnterior < fechaActual) {
              // Calcular nuevo interés y total_cuota
              const capitalAnterior = cuotaAnterior.capital;
              const tasa = credito.tasa / 100;

              const tasat = credito.tasa;

              const nuevoInteres = capitalAnterior * tasa;
              const totalCuota = capitalAnterior + nuevoInteres;

              // Guardar el documento antes de establecerlo en 0
              const documento = cuotaAnterior.documento;

              // Calcular nueva fecha (un mes más)
              const nuevaFecha = new Date(fechaCuotaAnterior);
              nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);

              // Obtener el consecutivo de la siguiente cuota
              const consecutivoSiguienteCuota =
                parseInt(cuotaAnterior.Numero_cuota, 10) + 1;

              // Insertar nueva cuota en la tabla amortizacion
              const insertQuery = `
                INSERT INTO amortizacion (prestamoID, documento, Numero_cuota, fecha_pago, capital, interes, total_cuota, saldo)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
              `;

              await pool.query(insertQuery, [
                prestamoID,
                documento, // Insertar el documento
                consecutivoSiguienteCuota,
                nuevaFecha,
                capitalAnterior,
                nuevoInteres,
                totalCuota,
              ]);

              // Establecer el capital de la cuota morosa en 0 y copiar el interés a total_cuota
              const updateQuery = `
                 UPDATE amortizacion
                 SET capital = 0,
                 total_cuota = interes
                  WHERE id = ?
                 `;

              await pool.query(updateQuery, [cuotaAnterior.id]);

              totalRegistrosActualizados++;
            }
          }
        })
      );

      // Pausa de 1 segundo después de procesar cada 1000 registros
      if (offset % 1000 === 0) {
        console.log(
          `Procesados ${offset} registros. Pausando por 1 segundo...`
        );
        await sleep(1000);
      }

      offset += pageSize;
    }

    // Devolver la respuesta con el total de registros actualizados
    res.status(200).json({
      success: true,
      totalRegistrosActualizados: totalRegistrosActualizados,
    });
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ success: false, error: "Error en la solicitud" });
  }
};
