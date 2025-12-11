import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((val) => (val ? parseInt(val) : 3000)),
  DATABASE_URL: z.string().nonempty('La variable DATABASE_URL es requerida'),
  ACTUALIZAR_PROCESOS_CRON: z.string().optional(),
  ACTUALIZAR_PROCESO_SEGUNDA_INSTANCIA_CRON: z.string().optional(),
  NOTIFICAR_ACTUACIONES_PROCESO_JUDICIAL_CRON: z.string().optional(),
  NOTIFICAR_ACTUACIONES_SEGUNDA_INSTANCIA_CRON: z.string().optional(),
  NOTIFICAR_CONTRATO_EXPIRANDO_CRON: z.string().optional(),
  NOTIFICAR_EVENTO_CALENDARIO_CRON: z.string().optional(),
  INACTIVAR_USUARIOS_CRON: z.string().optional(),
  RAMA_JUDICIAL_URL: z
    .string()
    .nonempty('La variable RAMA_JUDICIAL_URL es requerida'),
  NODE_ENV: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Fallo la validación de variables de entorno:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

const safeEnv = parsedEnv.data;

export const config = {
  port: safeEnv.PORT || 3000,
  database: safeEnv.DATABASE_URL || '',
  ramaJudicialUrl: safeEnv.RAMA_JUDICIAL_URL || '',
  actualizarProcesoCron: safeEnv.ACTUALIZAR_PROCESOS_CRON || '0 0 * * *',
  actualizarProcesoSegundaInstanciaCron: safeEnv.ACTUALIZAR_PROCESO_SEGUNDA_INSTANCIA_CRON || '0 0 * * *',
  notificarActuacionesProcesoJudicialCron: safeEnv.NOTIFICAR_ACTUACIONES_PROCESO_JUDICIAL_CRON || '0 0 * * *',
  notificarActuacionesSegundaInstanciaCron: safeEnv.NOTIFICAR_ACTUACIONES_SEGUNDA_INSTANCIA_CRON || '0 0 * * *',
  notificarContratoExpirandoCron: safeEnv.NOTIFICAR_CONTRATO_EXPIRANDO_CRON || '0 0 * * *',
  notificarEventoCalendarioCron: safeEnv.NOTIFICAR_EVENTO_CALENDARIO_CRON || '0 0 * * *',
  nodeEnv: safeEnv.NODE_ENV || 'production',
  inactivarUsuariosCron: safeEnv.INACTIVAR_USUARIOS_CRON || '0 0 * * *',
};
