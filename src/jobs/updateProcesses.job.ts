import cron from 'node-cron';
import { CronUpdateService } from '../services/cronUpdate.services';
import { config } from '../config/config';
import { log } from '../utils/formatLog';

const service = new CronUpdateService();

// Actualización de actuaciones de primera instancia - Cada noche a las 12:00 AM
cron.schedule(config.actualizarProcesoCron, async () => {
  log.info('🌙 Iniciando actualización de actuaciones de primera instancia...');
  try {
    const resultados = await service.ejecutarActualizacion();
    const procesosConNuevasActuaciones = resultados.filter(r => r.insertadas > 0);

    if (procesosConNuevasActuaciones.length > 0) {
      log.info(`📊 Procesos con nuevas actuaciones: ${procesosConNuevasActuaciones.length}`);
    }
    log.success('✅ Actualización de primera instancia completada.');
  } catch (error: any) {
    log.error('❌ Error en actualización de primera instancia:', error);
  }
}, {
  timezone: 'America/Bogota',
});

// Actualización de actuaciones de segunda instancia - Cada noche a las 1:00 AM
cron.schedule(config.actualizarProcesoSegundaInstanciaCron, async () => {
  log.info('🌙 Iniciando actualización de actuaciones de segunda instancia...');
  try {
    const resultados = await service.ejecutarActualizacionSegundaInstancia();
    const procesosConNuevasActuaciones = resultados.filter(r => r.insertadas > 0);

    if (procesosConNuevasActuaciones.length > 0) {
      log.info(`📊 Segundas instancias con nuevas actuaciones: ${procesosConNuevasActuaciones.length}`);
    }
    log.success('✅ Actualización de segunda instancia completada.');
  } catch (error: any) {
    log.error('❌ Error en actualización de segunda instancia:', error);
  }
}, {
  timezone: 'America/Bogota',
});

log.info('🚀 Tareas programadas de actualización iniciadas correctamente.');