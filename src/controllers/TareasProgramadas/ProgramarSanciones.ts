// tareasProgramadas.ts

import { Request, Response, Router } from "express"; // Asegúrate de importar Request y Response si aún no lo has hecho
import { pool } from "../../db";
import { RowDataPacket } from "mysql2";
import axios from "axios";
import { NOTIFICATION_API, API_SERVER, ADMIN_API } from "../../config";
import moment from "moment-timezone";
import mysql from "mysql2/promise";




const apiURL_notificar = NOTIFICATION_API;

const apiURL_server = API_SERVER;

const apiURL_panel = ADMIN_API;

// Proceso de actualización de pago en amortizador y historial
export const CalcularSanciones = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "calcular sanciones";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

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

export const CreditoAmortizador = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "credito amortizador";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

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

export const NuevoSaldoAnteriorBolsa = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fecha = new Date().toISOString().split("T")[0]; // Obtiene la fecha actual en formato YYYY-MM-DD

  const fechaAyer = new Date();
  fechaAyer.setDate(fechaAyer.getDate() - 1);
  const fechaAyerISO = fechaAyer.toISOString().split("T")[0];

  const tareas = "nuevo saldo anterior";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  console.log("fecha de hoy", fecha);
  console.log("fecha de ayer", fechaAyerISO);
  try {
    // Consulta SQL para buscar todos los registros en la tabla bolsas
    const bolsasQuery = "SELECT nombre, codigo FROM bolsas";

    // Ejecuta la consulta para obtener las bolsas
    const [bolsasRows] = await pool.query<RowDataPacket[]>(bolsasQuery, []);

    // Verifica si se encontraron bolsas
    if (bolsasRows.length === 0) {
      console.log("No se encontraron bolsas");
      res.status(404).json({ error: "No se encontraron bolsas" });
      return;
    }

    // Array para almacenar los resultados finales
    const resultados = [];

    // Itera sobre cada bolsa encontrada
    for (const bolsaRow of bolsasRows) {
      const bolsa = bolsaRow.nombre;
      const documento = bolsaRow.codigo;

      // Consulta SQL para verificar si ya existe un registro en Saldo_anterior para hoy
      const verificarSaldoAnteriorQuery = `
        SELECT 1 FROM saldo_anterior
        WHERE DATE(fecha_registro) = ? AND bolsa = ? LIMIT 1;
      `;

      // Ejecuta la consulta para verificar la existencia de un registro en Saldo_anterior
      const [verificarSaldoAnteriorRows] = await pool.query<RowDataPacket[]>(
        verificarSaldoAnteriorQuery,
        [fecha, bolsa]
      );

      // Si ya existe un registro para hoy, no realiza el proceso
      if (verificarSaldoAnteriorRows.length > 0) {
        console.log(
          `Ya existe un registro en saldo_anterior para hoy en la bolsa ${bolsa}`
        );
      } else {
        // Consulta SQL para obtener el saldo anterior de la bolsa actual en la tabla Saldo_anterior
        const saldoAnteriorQuery = `
          SELECT CAST(saldo AS DECIMAL(10, 0)) as saldo FROM saldo_anterior
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Ejecuta la consulta para obtener el saldo anterior
        const [saldoAnteriorRows] = await pool.query<RowDataPacket[]>(
          saldoAnteriorQuery,
          [fechaAyerISO, bolsa]
        );

        // Consulta SQL para sumar los valores de la bolsa actual en la tabla historial_pagos
        const sumaHistorialPagosQuery = `
          SELECT CAST(SUM(total_pagado) AS DECIMAL(10, 0)) as total FROM historial_pagos
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Consulta SQL para sumar los valores de la bolsa actual en la tabla gastos
        const sumaGastosQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM gastos
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Consulta SQL para sumar los valores de la bolsa actual en la tabla inversiones
        const sumaInversionesQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM inversiones
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Consulta SQL para sumar los valores de transferencias de salida
        const transferenciasSalidaQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM transferencias
          WHERE DATE(fecha_registro) = ? AND salida = ?;
        `;

        // Consulta SQL para sumar los valores de transferencias de ingreso
        const transferenciasIngresoQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM transferencias
          WHERE DATE(fecha_registro) = ? AND ingreso = ?;
        `;

        // Consulta SQL para sumar los valores de desembolsos de ingreso
        const DesembolsosIngresoQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM desembolso
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Ejecuta la consulta para obtener la suma de valores de historial_pagos
        const [sumaHistorialPagosRows] = await pool.query<RowDataPacket[]>(
          sumaHistorialPagosQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de gastos
        const [sumaGastosRows] = await pool.query<RowDataPacket[]>(
          sumaGastosQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de inversiones
        const [sumaInversionesRows] = await pool.query<RowDataPacket[]>(
          sumaInversionesQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de transferencias de salida
        const [transferenciasSalidaRows] = await pool.query<RowDataPacket[]>(
          transferenciasSalidaQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de transferencias de ingreso
        const [transferenciasIngresoRows] = await pool.query<RowDataPacket[]>(
          transferenciasIngresoQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de desembolsos de ingreso
        const [desembolsosIngresoRows] = await pool.query<RowDataPacket[]>(
          DesembolsosIngresoQuery,
          [fechaAyerISO, bolsa]
        );

        // Obtiene los valores de historial de pagos, gastos e inversiones para la bolsa actual
        // Obtiene el saldo anterior para la bolsa actual
        const saldoAnterior = saldoAnteriorRows[0]?.saldo || 0;
        const Recaudos = sumaHistorialPagosRows[0].total || 0;
        const Gastos = sumaGastosRows[0].total || 0;
        const Inversiones = sumaInversionesRows[0].total || 0;
        const TransferenciasSalida = transferenciasSalidaRows[0].total || 0;
        const TransferenciasIngreso = transferenciasIngresoRows[0].total || 0;
        const Prestamos = desembolsosIngresoRows[0].total || 0;

        // Calcula el saldo actual como un número decimal
        const saldoActual =
          parseFloat(saldoAnterior) +
          parseFloat(Inversiones) +
          parseFloat(Recaudos) -
          parseFloat(Gastos) +
          parseFloat(TransferenciasIngreso) -
          parseFloat(TransferenciasSalida) -
          parseFloat(Prestamos);

        // Añade el resultado a la lista final
        resultados.push({
          bolsa,
          saldoAnterior,
          TransferenciasIngreso,
          Inversiones,
          Recaudos,
          Prestamos,
          Gastos,
          TransferenciasSalida,
          saldoActual,
        });

        // Inserta en la tabla Saldo_anterior los valores calculados
        const insertSaldoAnteriorQuery = `
          INSERT INTO saldo_anterior (fecha_registro, bolsa, documento, saldo)
          VALUES (?, ?, ?, ?);
        `;

        await pool.query(insertSaldoAnteriorQuery, [
          fecha,
          bolsa,
          documento,
          saldoActual,
        ]);

        console.log(
          `Nuevo registro insertado en saldo_anterior para la bolsa ${bolsa}`
        );
      }
    }

    // Devuelve la lista final de resultados
    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
};

export const NuevoSaldoAnteriorproveedores = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fecha = new Date().toISOString().split("T")[0]; // Obtiene la fecha actual en formato YYYY-MM-DD

  const tareas = "nuevo saldo bolsa proveedor";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  const fechaAyer = new Date();
  fechaAyer.setDate(fechaAyer.getDate() - 1);
  const fechaAyerISO = fechaAyer.toISOString().split("T")[0];

  // console.log("fecha de hoy", fecha);
  // console.log("fecha de ayer", fechaAyerISO);
  try {
    // Consulta SQL para buscar todos los registros en la tabla bolsas
    const bolsasQuery = "SELECT nombre, documento FROM user_admin";

    // Ejecuta la consulta para obtener las bolsas
    const [bolsasRows] = await pool.query<RowDataPacket[]>(bolsasQuery, []);

    // Verifica si se encontraron bolsas
    if (bolsasRows.length === 0) {
      console.log("No se encontraron proveedor");
      res.status(404).json({ error: "No se encontraron proveedor" });
      return;
    }

    // Array para almacenar los resultados finales
    const resultados = [];

    // Itera sobre cada bolsa encontrada
    for (const bolsaRow of bolsasRows) {
      const bolsa = bolsaRow.nombre;
      const documento = bolsaRow.documento;

      // Consulta SQL para verificar si ya existe un registro en Saldo_anterior para hoy
      const verificarSaldoAnteriorQuery = `
        SELECT 1 FROM saldo_anterior_proveedor
        WHERE DATE(fecha_registro) = ? AND documento = ? LIMIT 1;
      `;

      // Ejecuta la consulta para verificar la existencia de un registro en Saldo_anterior
      const [verificarSaldoAnteriorRows] = await pool.query<RowDataPacket[]>(
        verificarSaldoAnteriorQuery,
        [fecha, documento]
      );

      // Si ya existe un registro para hoy, no realiza el proceso
      if (verificarSaldoAnteriorRows.length > 0) {
        // console.log(
        //   `Ya existe un registro en saldo_anterior_proveedor para hoy en la bolsa ${bolsa}`
        // );
      } else {
        // Consulta SQL para obtener el saldo anterior de la bolsa actual en la tabla Saldo_anterior
        const saldoAnteriorQuery = `
          SELECT CAST(saldo AS DECIMAL(10, 0)) as saldo FROM saldo_anterior_proveedor
          WHERE DATE(fecha_registro) = ? AND documento = ?;
        `;

        // Ejecuta la consulta para obtener el saldo anterior
        const [saldoAnteriorRows] = await pool.query<RowDataPacket[]>(
          saldoAnteriorQuery,
          [fechaAyerISO, documento]
        );

        // Consulta SQL para sumar los valores de la bolsa actual en la tabla historial_pagos
        const sumaHistorialPagosQuery = `
          SELECT CAST(SUM(total_pagado) AS DECIMAL(10, 0)) as total FROM historial_pagos
          WHERE DATE(fecha_registro) = ? AND proveedor = ?;
        `;

        // Consulta SQL para sumar los valores de la bolsa actual en la tabla gastos
        const sumaGastosQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM gastos
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Consulta SQL para sumar los valores de la bolsa actual en la tabla inversiones
        const sumaInversionesQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM inversiones
          WHERE DATE(fecha_registro) = ? AND bolsa = ?;
        `;

        // Consulta SQL para sumar los valores de desembolsos de ingreso
        const DesembolsosIngresoQuery = `
          SELECT CAST(SUM(valor) AS DECIMAL(10, 0)) as total FROM desembolso
          WHERE DATE(fecha_registro) = ? AND proveedor = ?;
        `;

        // Ejecuta la consulta para obtener la suma de valores de historial_pagos
        const [sumaHistorialPagosRows] = await pool.query<RowDataPacket[]>(
          sumaHistorialPagosQuery,
          [fechaAyerISO, documento]
        );

        // Ejecuta la consulta para obtener la suma de valores de gastos
        const [sumaGastosRows] = await pool.query<RowDataPacket[]>(
          sumaGastosQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de inversiones
        const [sumaInversionesRows] = await pool.query<RowDataPacket[]>(
          sumaInversionesQuery,
          [fechaAyerISO, bolsa]
        );

        // Ejecuta la consulta para obtener la suma de valores de desembolsos de ingreso
        const [desembolsosIngresoRows] = await pool.query<RowDataPacket[]>(
          DesembolsosIngresoQuery,
          [fechaAyerISO, documento]
        );

        // Obtiene los valores de historial de pagos, gastos e inversiones para la bolsa actual
        // Obtiene el saldo anterior para la bolsa actual
        const saldoAnterior = saldoAnteriorRows[0]?.saldo || 0;
        const Recaudos = sumaHistorialPagosRows[0].total || 0;
        const Gastos = sumaGastosRows[0].total || 0;
        const Inversiones = sumaInversionesRows[0].total || 0;
        const Prestamos = desembolsosIngresoRows[0].total || 0;

        // Calcula el saldo actual como un número decimal
        const saldoActual =
          parseFloat(saldoAnterior) +
          parseFloat(Inversiones) +
          parseFloat(Recaudos) -
          parseFloat(Gastos) -
          parseFloat(Prestamos);

        // Añade el resultado a la lista final
        resultados.push({
          bolsa,
          saldoAnterior,
          Inversiones,
          Recaudos,
          Prestamos,
          Gastos,
          saldoActual,
        });

        // Inserta en la tabla Saldo_anterior los valores calculados
        const insertSaldoAnteriorQuery = `
          INSERT INTO saldo_anterior_proveedor ( proveedor, documento, saldo)
          VALUES ( ?, ?, ?);
        `;

        await pool.query(insertSaldoAnteriorQuery, [
          bolsa,
          documento,
          saldoActual,
        ]);

        console.log(
          `Nuevo registro insertado en Saldo_anterior para la bolsa ${bolsa}`
        );
      }
    }

    // Devuelve la lista final de resultados
    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
};

export const NotificarMensaje = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea msm";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  try {
    // Obtener la fecha actual formateada
    const fechaActual = new Date();

    const celular = 3105399184;
    const codigoMensaje = `Michel 😁  se completo la tarea  ${fechaActual}`;

    // Enviar mensaje de texto
    await axios.post(`${apiURL_notificar}/notificarViaSMS`, {
      toNumber: celular,
      content: codigoMensaje,
      isPriority: true,
    });

    // Resto del código...
  } catch (error) {
    console.error("Error al realizar la operación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const ListaCobranza = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "lista cobranza L J";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }
  try {
    // Consulta SQL para eliminar todos los registros de la tabla 'gestion_cartera'
    const deleteQuery = "DELETE FROM gestion_cartera";
    await pool.query(deleteQuery);

    // Consulta SQL para obtener todos los datos de un usuario por documento
    const query = "SELECT * FROM detalle_credito WHERE ESTADO IN (?,?,?,?,?)";
    const [creditoResult] = await pool.query<RowDataPacket[]>(query, [
      "EN CURSO",
      "EN PROCESO",
      "JURIDICO",
      "CASTIGADO",
      "PREJURIDICO",
    ]);

    // Verifica si se encontraron resultados
    if (creditoResult.length > 0) {
      // Usuarios encontrados en detalle_credito, ahora realizamos la consulta en amortizacion
      const promises = creditoResult.map(async (detalleCredito) => {
        // Consulta SQL para obtener la fecha de la primera cuota con saldo en amortizacion
        const amortizacionQuery = `
      SELECT fecha_pago, SUM(total_cuota + sancion) AS saldoTotal
      FROM amortizacion
      WHERE prestamoID = ?
        AND total_cuota > 0
        AND fecha_pago < NOW()  -- Seleccionar solo cuotas vencidas
      GROUP BY fecha_pago
      ORDER BY fecha_pago ASC
    `;

        const ValorMora = `
      SELECT 
        SUM(total_cuota + sancion) AS saldoTotal
      FROM 
        amortizacion
      WHERE 
        prestamoID = ?
        AND total_cuota > 0
        AND fecha_pago < NOW();  -- Seleccionar solo cuotas vencidas
    `;

        const [amortizacionResult] = await pool.query<RowDataPacket[]>(
          amortizacionQuery,
          [detalleCredito.prestamo_ID]
        );

        const [valorMoraResult] = await pool.query<RowDataPacket[]>(ValorMora, [
          detalleCredito.prestamo_ID,
        ]);
        // Verificar si se encontró una cuota con saldo
        if (amortizacionResult.length > 0) {
          const fechaPagoString = amortizacionResult[0].fecha_pago;
          const fechaPago = new Date(fechaPagoString);
          const saldoTotal = amortizacionResult[0].saldoTotal;
          const valormora = valorMoraResult[0].saldoTotal; // Ag

          // Calcular los días restantes hasta la fecha de pago
          const fechaActual = new Date();
          const diferenciaMilisegundos: number =
            fechaPago.getTime() - fechaActual.getTime();
          const diasRestantes: number = Math.ceil(
            diferenciaMilisegundos / (1000 * 60 * 60 * 24)
          );

          console.log("Días restantes:", diasRestantes);
          console.log("Saldo Total:", saldoTotal);

          // Validar si el documento existe en la tabla mi_ruta
          const documentoExistsQuery =
            "SELECT * FROM mi_ruta WHERE documento = ?";
          const [documentoExistsResult] = await pool.query<RowDataPacket[]>(
            documentoExistsQuery,
            [detalleCredito.documento]
          );

          if (documentoExistsResult.length === 0) {
            // Insertar la información en una nueva tabla llamada 'gestion_cartera'
            const insertQuery = `
              INSERT INTO gestion_cartera (
                prestamo_ID,
                documento,
                estado,
                fecha_pago,
                dias,
                valor,
                valor_mora,
                origen
              ) VALUES (?, ?, ?, ?, ?, ?, ?,?)`;

            const values = [
              detalleCredito.prestamo_ID,
              detalleCredito.documento,
              detalleCredito.estado,
              fechaPago,
              diasRestantes,
              saldoTotal,
              valormora,
              detalleCredito.origen,
            ];

            await pool.query(insertQuery, values);

            // ... (resto del código)

            return detalleCredito;
          } else {
            console.log(
              "Documento encontrado en la tabla mi_ruta, no se insertarán los datos."
            );
            return null;
          }
        } else {
          console.log(
            "No se encontró cuota con saldo para el préstamo ID:",
            detalleCredito.prestamo_ID
          );
          return null;
        }
      });

      // Esperamos a que todas las consultas en paralelo se completen
      const userDataWithAmortizacion = await Promise.all(promises);

      // Filtrar resultados para excluir aquellos donde no se encontró una cuota con saldo
      const filteredResults = userDataWithAmortizacion.filter(
        (result) => result !== null
      );

      // Devolvemos la respuesta con los datos combinados
      res.status(200).json(filteredResults);
    } else {
      // No se encontraron usuarios con el documento proporcionado
      console.log("credito no encontrado");
      res.status(404).json({ error: "credito no encontrado" });
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
};

export const listadoCobranzaActualizar = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "lista cobranza actualizada";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const recordarSinMora = await axios.post(
      `${apiURL_panel}/api/cobranza/listado/actualizar`
    );
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};

export const TareasProgramadasServidor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea programada servidor";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const RecaulcularCreditosVencidos = await axios.post(
      `${apiURL_panel}/api/crietoamortizador/calcular`
    );

    // Retrasar la siguiente solicitud por 1 minuto
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Hacer la solicitud HTTP para Recalcular Sanciones después del retraso
    const RecaulcularSanciones = await axios.post(
      `${apiURL_panel}/api/sanciones/calcular`
    );

    // Retrasar la siguiente solicitud por 1 minuto
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Hacer la solicitud HTTP para Recalcular Sanciones después del retraso
    const Cerrarbolsa = await axios.get(
      `${apiURL_panel}/api/movimiento/cierre/saldo/anterior`
    );

    // Retrasar la siguiente solicitud por 1 minuto
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Hacer la solicitud HTTP para Recalcular Sanciones después del retraso
    const CerrarProveedor = await axios.get(
      `${apiURL_panel}/api/movimiento/cierre/saldo/proveedores`
    );

    // Retrasar la siguiente solicitud por 1 minuto
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Hacer la solicitud HTTP para Recalcular Sanciones después del retraso
    const ListaEnRuat = await axios.post(
      `${apiURL_panel}/api/cobranza/listado/actualizar`
    );

    // Acceder a los datos de la respuesta
    const responseData = RecaulcularSanciones.data;

    // Obtener la fecha actual formateada
    const fechaActual = new Date();

    const celular = 3105399184;
    const codigoMensaje = `Tareas completadas😁  FINOVA  ${fechaActual}`;

    // Enviar mensaje de texto
    await axios.post(`${apiURL_notificar}/notificarViaSMS`, {
      toNumber: celular,
      content: codigoMensaje,
      isPriority: true,
    });

    // Hacer algo con los datos, por ejemplo, imprimirlos
    console.log(responseData);

    // Puedes enviar la respuesta al cliente si es necesario
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};

export const TareasProgramadasSinMora = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea programada sin mora";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const recordarSinMora = await axios.post(
      `${apiURL_panel}/api/cartera/msms/recordatorio`
    );
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};

export const TareasProgramadasMoraPrimera = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea programada mora primera 30";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const recordarSinMora = await axios.post(
      `${apiURL_panel}/api/cartera/msm/30`
    );
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};

export const TareasProgramadasMoraSegundo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea programada mora segunda 60";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const recordarSinMora = await axios.post(
      `${apiURL_panel}/api/cartera/msm/60`
    );
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};

export const TareasProgramadasMoraTercero = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea programada mora tercero 90";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }
  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const recordarSinMora = await axios.post(
      `${apiURL_panel}/api/cartera/msm/90`
    );
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};

export const TareasProgramadasMoraCuatro = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "tarea programada mora cuarto 150";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }
  try {
    // Hacer la solicitud HTTP para Recalcular Créditos Vencidos
    const recordarSinMora = await axios.post(
      `${apiURL_panel}/api/cartera/msm/150`
    );
  } catch (error) {
    console.error("Error en la solicitud HTTP:", error);
    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la solicitud HTTP" });
  }
};



//  actualiza la base de datos de GOLDRA servidor 186
export const sincronizarMysqlGOLDRA = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "sincronizar MYSQL GOLDRA";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("Ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  let sourceConnection: mysql.Connection | null = null;
  let targetConnection: mysql.Connection | null = null;

  try {
    // Conexión al servidor de origen
    sourceConnection = await mysql.createConnection({
      host: '201.236.243.161',
      user: 'MICHEL_SERVER',
      password: 'Michel137909*',
      database: 'GOLDRA_LICANCE'
    });

    // Conexión al servidor de destino
    targetConnection = await mysql.createConnection({
      host: '186.87.165.129',
      user: 'MICHEL_SERVER',
      password: 'Michel137909**',
      database: 'GOLDRA_LICANCE'
    });

    // Iniciar la transacción en el servidor de destino
    await targetConnection.beginTransaction();

    // Obtener lista de tablas del origen
    const [tables] = await sourceConnection.query('SHOW TABLES') as mysql.RowDataPacket[];
    const tableNames = tables.map((row: any) => Object.values(row)[0]);

    for (const tableName of tableNames) {
      // Copiar datos de la tabla de origen a la de destino
      const [rows] = await sourceConnection.query(`SELECT * FROM ${tableName}`) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]).join(', ');
      const valuesPlaceholders = Object.keys(rows[0]).map(() => '?').join(', ');
      const updateSet = Object.keys(rows[0]).map(key => `${key} = VALUES(${key})`).join(', ');

      const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${valuesPlaceholders}) ON DUPLICATE KEY UPDATE ${updateSet}`;

      for (const row of rows) {
        await targetConnection.query(insertQuery, Object.values(row));
      }
    }

    // Confirmar la transacción
    await targetConnection.commit();

    console.log('Sincronización completada con éxito.');
    res.status(200).json({ message: "Sincronización completada con éxito" });

  } catch (error) {
    console.error("Error en la sincronización:", error);

    // Revertir la transacción en caso de error
    if (targetConnection) {
      await targetConnection.rollback();
    }

    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la sincronización" });
  } finally {
    // Cerrar las conexiones
    if (sourceConnection) {
      await sourceConnection.end();
    }
    if (targetConnection) {
      await targetConnection.end();
    }
  }
};


//  actualiza la base de datos SOUCREDITO servidor enduro
export const sincronizarMysqlSOLUCREDITO = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "sincronizar MYSQL FINOVA";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("Ya existe un registro en:", tareas, fecha, hora);
    return; // Detener la ejecución si la tarea ya existe
  }

  let sourceConnection: mysql.Connection | null = null;
  let targetConnection: mysql.Connection | null = null;

  try {
    // Conexión al servidor de origen
    sourceConnection = await mysql.createConnection({
      host: '201.236.243.161',
      user: 'MICHEL_SERVER',
      password: 'Michel137909*',
      database: 'SOLUCREDITFINOVA'
    });

    // Conexión al servidor de destino
    targetConnection = await mysql.createConnection({
      host: '186.87.165.129',
      user: 'MICHEL_SERVER',
      password: 'Michel137909**',
      database: 'SOLUCREDITFINOVA'
    });

    // Iniciar la transacción en el servidor de destino
    await targetConnection.beginTransaction();

    const orderedTables = [
      'user_cliente',
      'user_admin',
      'bolsas',
      'estudio_de_credito',
      'info_personal',
      'info_contacto',
      'info_bancario',
      'info_laboral',
      'info_referencias',
      'documentos_estudio',
      'documentos_registro',
      'detalle_credito',
      'amortizacion',
      'desembolso',
      'detalle_efecty',
      'comentarios',
      'saldo_anterior',
      'saldo_anterior_proveedor',
      // 'archivo_migra',
      'cifin',
      'confirmar_codigo',
      'estudios_realizados',
      'gastos',
      'geo_city',
      'geo_department',
      'gestion_cartera',
      'historial_pagos',
      'inversiones',
      'lista_bancos',
      'lista_comentario',
      'lista_documentos',
      'lista_gastos',
      'lista_tipo_credito',
      'mi_ruta',
      'pagos_payvalida',
      'tareasprogramadas',
      'transferencias',
      'codeudor',
      "detalle_transferencia"

    ];

    // Copiar datos de las tablas con claves foráneas
    for (const tableName of orderedTables) {
      console.log(`Iniciando sincronización para la tabla ${tableName}...`);
      try {
        const [rows] = await sourceConnection.query(`SELECT * FROM ${tableName}`) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
        if (rows.length === 0) {
          console.log(`Tabla ${tableName} está vacía. Saltando...`);
          continue;
        }

        const columns = Object.keys(rows[0]).join(', ');
        const valuesPlaceholders = Object.keys(rows[0]).map(() => '?').join(', ');
        const updateSet = Object.keys(rows[0]).map(key => `${key} = VALUES(${key})`).join(', ');

        const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${valuesPlaceholders}) ON DUPLICATE KEY UPDATE ${updateSet}`;

        for (const row of rows) {
          try {
            await targetConnection.query(insertQuery, Object.values(row));
          } catch (err) {
            // Manejar errores específicos de claves foráneas aquí
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
              console.warn(`Error de clave foránea en la tabla ${tableName}: ${err.message}`);
            } else {
              throw err;
            }
          }
        }
        console.log(`Tabla ${tableName} sincronizada con éxito.`);
      } catch (err) {
        console.error(`Error al copiar datos en la tabla ${tableName}: ${err.message}`);
      }
    }

    // Obtener lista de todas las tablas del origen
    const [allTables] = await sourceConnection.query('SHOW TABLES') as mysql.RowDataPacket[];
    const allTableNames = allTables.map((row: any) => Object.values(row)[0]);

    // Filtrar las tablas que no tienen claves foráneas
    const remainingTables = allTableNames.filter(tableName => !orderedTables.includes(tableName));

    // Copiar datos de las tablas restantes
    // for (const tableName of remainingTables) {
    //   console.log(`Iniciando sincronización para la tabla sin claves foráneas ${tableName}...`);
    //   try {
    //     const [rows] = await sourceConnection.query(`SELECT * FROM ${tableName}`) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
    //     if (rows.length === 0) {
    //       console.log(`Tabla ${tableName} está vacía. Saltando...`);
    //       continue;
    //     }

    //     const columns = Object.keys(rows[0]).join(', ');
    //     const valuesPlaceholders = Object.keys(rows[0]).map(() => '?').join(', ');
    //     const updateSet = Object.keys(rows[0]).map(key => `${key} = VALUES(${key})`).join(', ');

    //     const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${valuesPlaceholders}) ON DUPLICATE KEY UPDATE ${updateSet}`;

    //     for (const row of rows) {
    //       await targetConnection.query(insertQuery, Object.values(row));
    //     }
    //     console.log(`Tabla ${tableName} sincronizada con éxito.`);
    //   } catch (err) {
    //     console.error(`Error al copiar datos en la tabla ${tableName}: ${err.message}`);
    //   }
    // }

    // Confirmar la transacción
    await targetConnection.commit();
    console.log('Sincronización completada con éxito. SOLUCREDITO');
    res.status(200).json({ message: "Sincronización completada con éxito SOLUCREDITO" });

  } catch (error) {
    console.error("Error en la sincronización: SOLUCREDITO", error);

    // Revertir la transacción en caso de error
    if (targetConnection) {
      await targetConnection.rollback();
    }

    // Manejar el error y enviar una respuesta de error al cliente
    res.status(500).json({ error: "Error en la sincronización SOLUCREDITO" });
  } finally {
    // Cerrar las conexiones
    if (sourceConnection) {
      await sourceConnection.end();
    }
    if (targetConnection) {
      await targetConnection.end();
    }
  }
};

//  si el cliente tiene mas de 90 dias en mora se suspende cupo de credito
export const SuspenderCupo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "Mora de 90 suspender cupo";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  if (!tareaInsertada) {
    console.log("Ya existe un registro en:", tareas, fecha, hora);
    return
  }

  try {
    // Consulta SQL para obtener todos los documentos de user_cliente
    const documentosQuery = `
      SELECT documento 
      FROM user_cliente
    `;

    console.log("Ejecutando consulta para obtener documentos...");
    const [documentosResults] = await pool.query<RowDataPacket[]>(documentosQuery);

    if (documentosResults.length === 0) {
      console.log("No se encontraron documentos en la base de datos.");
      res.status(200).json({ message: "No hay documentos para validar." });
      return;
    }

    const morasMayores90 = [];
    const documentosConMora = new Set(); // Usamos un Set para rastrear documentos únicos

    for (const { documento } of documentosResults) {
      // Primero, verificamos si existe en estudios_realizados y si el cupo es mayor a 0
      const estudiosQuery = `
        SELECT cupo 
        FROM estudios_realizados 
        WHERE documento = ? AND cupo > 0
      `;

      const [estudiosResults] = await pool.query<RowDataPacket[]>(estudiosQuery, [documento]);

      if (estudiosResults.length > 0) {
        const { cupo } = estudiosResults[0];

        // Ahora validamos la mora en la tabla amortizacion
        const amortizacionQuery = `
          SELECT 
            u.documento,
            a.total_cuota,
            a.fecha_pago,
            DATEDIFF(CURRENT_DATE, a.fecha_pago) AS dias_vencidos
          FROM 
            amortizacion a
          INNER JOIN 
            user_cliente u ON a.documento = u.documento
          WHERE 
            u.documento = ? AND 
            a.total_cuota > 0
        `;

        const [results] = await pool.query<RowDataPacket[]>(amortizacionQuery, [documento]);
        
        // Filtrar solo los que tienen días vencidos mayores a 90
        const morasDocumento = results.filter(result => result.dias_vencidos > 90);

        if (morasDocumento.length > 0 && !documentosConMora.has(documento)) {
          // Añadimos el documento al Set para evitar duplicados
          documentosConMora.add(documento);

          // Solo mostramos el primer resultado que cumple la condición
          const { total_cuota, dias_vencidos } = morasDocumento[0];
          console.log(`Cédula: ${documento}, Cupo: ${cupo}, Total Cuota: ${total_cuota}, Días Vencidos: ${dias_vencidos}`);

                    // Actualizar el cupo a 0 en la tabla estudios_realizados
          const updateQuery = `
            UPDATE estudios_realizados
            SET cupo = 0
            WHERE documento = ?
          `;
          await pool.query(updateQuery, [documento]);


  // Insertar un nuevo comentario en la tabla comentarios
  const insertComentarioQuery = `
    INSERT INTO comentarios (documento, comentario, tipo, creador, fecha_registro)
    VALUES (?, ?, ?, ?, NOW())
  `;
          
    const comentario = "SE SUSPENDE CUPO DE CRÉDITO POR MORA MAYOR A 90 DÍAS.";
  const tipo = "SUSPENDER";
  const creador = "SISTEMA PROGRAMADO"

    await pool.query(insertComentarioQuery, [documento, comentario, tipo, creador]);
  
          // Agregamos solo un registro por cédula al array de moras
          morasMayores90.push({
            documento,
            cupo,
            total_cuota,
            dias_vencidos,
          });
        }
      }
    }

    if (morasMayores90.length > 0) {
      res.status(200).json({ message: "Cupos suspendidos por mora.", moras: morasMayores90 });
    } else {
      res.status(200).json({ message: "No se encontraron moras mayores a 90 días." });
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
};

export const Temperatura_server = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tareas = "Calcular Temperatura servidor";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  // if (!tareaInsertada) {
  //   console.log("Ya existe un registro en:", tareas, fecha, hora);
  //   return
  // }
  try {
    // Simulación de obtener la temperatura del servidor
    const temperaturaDelServidor: unknown = await obtenerTemperaturaServidor();
  
    // Verificar si la temperatura es un número antes de hacer la comparación
    if (typeof temperaturaDelServidor === 'number') {
      console.log(`Temperatura del servidor: ${temperaturaDelServidor}°C`);
  
      if (temperaturaDelServidor > 40) {
        // Hacer la solicitud HTTP para recalcular créditos vencidos
        try {
          const recordarSinMora = await axios.post(
            `${apiURL_panel}/api/notificar/temperatura`,  // La URL de la API
            { temperatura: temperaturaDelServidor }  // Pasando la temperatura en el cuerpo de la solicitud
          );
          console.log("Créditos vencidos recalculados correctamente.");
        } catch (error) {
          console.error("Error al recalcular créditos vencidos:", error);
        }
  
        res.status(200).json({
          message: "La temperatura del servidor es mayor a 24°C. Se debe revisar el sistema.",
        });
      } else {
        res.status(200).json({
          message: `La temperatura del servidor es ${temperaturaDelServidor}°C. Todo está en orden.`,
        });
      }
    } else {
      res.status(400).json({
        error: "La temperatura obtenida no es un número válido.",
      });
    }
  
    // Función simulada para obtener la temperatura del servidor
    async function obtenerTemperaturaServidor(): Promise<unknown> {
      return new Promise((resolve, reject) => {
        // Simulación de una temperatura aleatoria entre 20°C y 30°C.
        const temperatura = Math.floor(Math.random() * 11) + 20;
        resolve(temperatura);
      });
    }
  
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
  
  
};



//  tarea para programar cierre de mes CIFIN 


export const ListadoCifin = async (req: Request, res: Response): Promise<void> => {
  const tareas = "Listado CIFIN";
  const tareaInsertada = await validarEInsertarTarea(tareas);
  const { fecha, hora } = obtenerFechaHoraBogota();

  // Comprobar si la tarea ya existe
  if (!tareaInsertada) {
    console.log("Ya existe un registro en:", tareas, fecha, hora);
    return; // Terminar la función si la tarea ya existe
  }

  try {
    // Realizar la solicitud GET a la URL especificada
    const response = await axios.get(`${apiURL_panel}/api/reporte/generar/reporte/cifin`);

    // Enviar la respuesta recibida al cliente
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error en la solicitud:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
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
