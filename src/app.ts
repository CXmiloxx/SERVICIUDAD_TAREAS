import express from 'express';
import './services/prisma.services.js';
import { config } from './config/config.js';
import './jobs/updateProcesses.job.js';
import './jobs/notifications.job.js';
import './jobs/users.job.js';

import { log } from './utils/formatLog.js';

const app = express();

app.use(express.json());

const startServer = async () => {
  try {
    app.listen(config.port, () => {
      const date = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
      });

      log.separator('===');
      log.success('🟢 Servidor iniciado');
      log.separator('-');
      log.info(`📦  Modo:        ${config.nodeEnv}`);
      log.info(`🌐  Puerto:      ${config.port}`);
      log.info(`🚀  URL:         http://localhost:${config.port}`);
      log.info(`🕒 Fecha/Hora:    ${date}`);
      log.info('🧠 Sistema de tareas automáticas en ejecución...');
      log.separator('===');

    });
  } catch (error) {
    log.separator('===');
    log.error('⛔ ERROR AL INICIAR SERVIDOR', error.message || error);
    log.separator('===');
    process.exit(1);
  }
};

startServer();
