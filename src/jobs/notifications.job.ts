import cron from 'node-cron';
import { log } from '../utils/formatLog';
import { CronNotificationsService } from '../services/cronNotificatios.services';
import { config } from '../config/config';

const notificationsService = new CronNotificationsService();

// Notificaciones de nuevas actuaciones de primera instancia - Cada día a las 2:15 AM (después de la actualización)
cron.schedule(config.notificarActuacionesProcesoJudicialCron, async () => {
  log.info('📢 Ejecutando tarea programada de notificaciones de nuevas actuaciones (primera instancia)...');
  try {
    await notificationsService.notificarNuevasActuacionesProcesoJudicialDelDia();
    log.success('✅ Notificaciones de primera instancia completadas.');
  } catch (error: any) {
    log.error('❌ Error en notificaciones de primera instancia:', error);
  }
}, {
  timeZone: 'America/Bogota',
});

// Notificaciones de nuevas actuaciones de segunda instancia - Cada día a las 2:45 AM (después de la actualización)
cron.schedule(config.notificarActuacionesSegundaInstanciaCron, async () => {
  log.info('📢 Ejecutando tarea programada de notificaciones de nuevas actuaciones (segunda instancia)...');
  try {
    await notificationsService.notificarNuevasActuacionesSegundaInstanciaDelDia();
    log.success('✅ Notificaciones de segunda instancia completadas.');
  } catch (error: any) {
    log.error('❌ Error en notificaciones de segunda instancia:', error);
  }
}, {
  timeZone: 'America/Bogota',
});

// Notificaciones de eventos del calendario - Cada día a las 7:00 AM
cron.schedule(config.notificarEventoCalendarioCron, async () => {
  log.info('📅 Ejecutando tarea programada de notificaciones de eventos del calendario...');
  try {
    await notificationsService.notificarEventosCalendario();
    log.success('✅ Notificaciones de eventos del calendario completadas.');
  } catch (error: any) {
    log.error('❌ Error en notificaciones de eventos del calendario:', error);
  }
}, {
  timeZone: 'America/Bogota',
});

// Notificaciones de contratos próximos a vencer - Cada lunes a las 6:30 AM
cron.schedule(config.notificarContratoExpirandoCron, async () => {
  log.info('📋 Ejecutando tarea programada de notificaciones de contratos próximos a vencer...');
  try {
    await notificationsService.contractsExpiringJob();
    log.success('✅ Notificaciones de contratos completadas.');
  } catch (error: any) {
    log.error('❌ Error en notificaciones de contratos:', error);
  }
}, {
  timeZone: 'America/Bogota',
});

log.info('🚀 Tareas programadas de notificaciones iniciadas correctamente.');