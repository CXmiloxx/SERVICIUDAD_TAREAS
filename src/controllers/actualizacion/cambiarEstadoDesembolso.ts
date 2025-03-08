import {Request, Response} from "express";
import {pool} from "../../db";
import axios from "axios";
import {ADMIN_API} from "../../config";

const apiURL_panel = ADMIN_API;

export const cambiarEstadoDesembolso = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {prestamoID, proveedor, estado, comentario, creador, bolsa} =
            req.body;

        // Verificar si ya existe un registro con el estado 'EN PROCESO'
        const [enProcesoRegistro] = await pool.query(
            "SELECT * FROM desembolso WHERE estado = 'EN PROCESO' AND prestamoID = ?",
            [prestamoID]
        );

        if (!(Array.isArray(enProcesoRegistro) && enProcesoRegistro.length > 0)) {
            // Si no existe un registro con el estado 'EN PROCESO' y el prestamoID, mostrar un mensaje
            res.status(400).json({
                mensaje: "El préstamo no se encuentra en proceso",
            });
            return;
        }

        // Convertir nombres a mayúsculas si es necesario
        const comentarioMayuscula = comentario.toUpperCase();
        const comentarioTotal = ` ESTADO: ${estado} Y PROVEEDOR ${proveedor} Y BOLSA ${bolsa} ${comentarioMayuscula}`;

        const creadorMayuscula = creador.toUpperCase();

        if (estado === "APROBADO") {
            // Actualizar estado en la tabla desembolso

            await pool.execute(
                "UPDATE desembolso SET estado = ?, proveedor = ?, bolsa = ?, fecha_registro = NOW() WHERE prestamoID = ? AND proveedor = '' AND bolsa = '' LIMIT 1",
                [estado, proveedor, bolsa, prestamoID]
            );

            const estadoCredito = "EN CURSO";

            // Actualizar información en detalle_credito
            await pool.execute(
                "UPDATE detalle_credito SET estado = ?, proveedor = ? WHERE prestamo_ID = ?",
                [estadoCredito, proveedor, prestamoID]
            );

            // Consultar el documento después de la actualización en detalle_credito
            const resultadoConsulta = await pool.query(
                "SELECT documento FROM detalle_credito WHERE prestamo_ID = ?",
                [prestamoID]
            );

            // Verificar si se encontró un resultado
            if (Array.isArray(resultadoConsulta) && resultadoConsulta.length > 0) {
                // Obtén el primer subarray y extrae el objeto con la propiedad 'documento'
                const primerSubarray = resultadoConsulta[0];

                if (Array.isArray(primerSubarray) && primerSubarray.length > 0) {
                    const primerObjeto = primerSubarray[0];

                    if (
                        primerObjeto &&
                        typeof primerObjeto === "object" &&
                        "documento" in primerObjeto
                    ) {
                        const documentoRecuperado = primerObjeto.documento;
                        const tipoComnetario = "DESEMBOLSO";
                        // Insertar comentario en la tabla comentarios
                        await pool.execute(
                            "INSERT INTO comentarios (documento, tipo, comentario, creador) VALUES (?,?,?,?)",
                            [
                                documentoRecuperado,
                                tipoComnetario,
                                comentarioTotal,
                                creadorMayuscula,
                            ]
                        );

                        console.log("El objeto no tiene la propiedad 'documento'.");
                    }
                }
            } else {
                console.log(
                    "No se encontró ningún resultado después de la actualización."
                );
            }
        } else {
            await axios.patch(`${apiURL_panel}/api/estado/desembolso/rechazado`, {
                prestamoID: prestamoID,
                proveedor: proveedor,
                estado: estado,
                comentario: comentario,
                creador: creador,
            });
            return;
        }
    } catch (error) {
        console.error("Error al actualizar información de referencias:", error);
        res.status(500).json({error: "Error interno del servidor"});
    }
};
