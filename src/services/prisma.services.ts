import { config } from '../config/config';
import { PrismaClient } from '@prisma/client';
import { log } from '../utils/formatLog';

class PrismaService extends PrismaClient {
  private static instance: PrismaService;

  private constructor() {
    super({
      log: ['warn', 'error'],
      datasources: {
        db: {
          url: config.database,
        },
      },
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
      log.success("Instancia de Prisma creada correctamente.");
    }
    return PrismaService.instance;
  }

  // Método para cerrar la conexión de forma limpia
  public async shutdown(): Promise<void> {
    await this.$disconnect();
    log.success("Conexión a la base de datos cerrada.");
  }
}

const prismaService = PrismaService.getInstance();

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  await prismaService.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prismaService.shutdown();
  process.exit(0);
});

export default prismaService;