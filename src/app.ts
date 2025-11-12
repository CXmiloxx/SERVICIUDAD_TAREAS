import express from 'express';
import prismaService from './services/prisma.services.js';
import { config } from './config/config.js';
import './jobs/updateProcesses.job.js';

const app = express();

app.use(express.json());

const startServer = async () => {
  try {
    await prismaService.connectDB();

    app.listen(config.port, () => {
      const date = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
      });

      console.clear();
      console.log('\n');
      console.log('=======================================================');
      console.log('              🚀 SERVIDOR INICIADO                    ');
      console.log('=======================================================');
      console.log(`  🌐 URL:           http://localhost:${config.port}/`);
      console.log(`  🧩 Puerto:        ${config.port}`);
      console.log(`  🕒 Fecha/Hora:    ${date}`);
      console.log('-------------------------------------------------------');
      console.log('  🧠 Sistema de tareas automáticas en ejecución...');
      console.log('=======================================================\n');
    });
  } catch (error) {
    console.error('=======================================================');
    console.error('⛔ ERROR AL INICIAR SERVIDOR');
    console.error('-------------------------------------------------------');
    console.error('Motivo:', error.message || error);
    console.error('=======================================================');
    process.exit(1);
  }
};

startServer();
