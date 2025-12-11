import cron from 'node-cron';
import { log } from '../utils/formatLog';
import { config } from '../config/config';
import { CronAuthService } from '../services/cronAuth.services';

const authService = new CronAuthService();

// Inactivación de usuarios - Cada día a las 2:15 AM (después de la actualización)
cron.schedule(config.inactivarUsuariosCron, async () => {
  log.info('📢 Ejecutando tarea programada de inactivación de usuarios...');
  try {
    await authService.inactiveUsersJob();
    log.success('✅ Inactivación de usuarios completada.');
  } catch (error: any) {
    log.error('❌ Error en inactivación de usuarios:', error);
  }
}, {
  timezone: 'America/Bogota',
});
