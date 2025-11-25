import cron from 'node-cron';
import { CronUpdateService } from '../services/cronUpdate.services';
import { config } from '../config/config';

const service = new CronUpdateService();

// Cada día a las 12:00 AM
cron.schedule(config.actualizarProcesoCron, async () => {
  console.log(
    '🌙 Ejecutando tarea programada de actualización a medianoche...',
  );
  await service.ejecutarActualizacion();
}, {
  timeZone: 'America/Bogota'
});


cron.schedule(config.actualizarProcesoSegundaInstanciaCron, async () => {
  console.log(
    '🌙 Ejecutando tarea programada de actualización a medianoche...',
  );
  await service.ejecutarActualizacionSegundaInstancia();
}, {
  timeZone: 'America/Bogota'
});