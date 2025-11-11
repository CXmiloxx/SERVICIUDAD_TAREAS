import { config } from '../config/config';
import { PrismaClient } from '@prisma/client';

// Singleton para el servicio de Prisma
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

  // Acceso a la única instancia del servicio
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  // Conexión a la base de datos
  public async connectDB(): Promise<void> {
    try {
      await this.$connect();
      console.log('✅ Conexión a la base de datos establecida correctamente.');
    } catch (error) {
      console.error('❌ Error al conectar con la base de datos:', error);
    }
  }

  // Desconecta la base de datos
  public async disconnectDB(): Promise<void> {
    try {
      await this.$disconnect();
      console.log('🔌 Conexión a la base de datos cerrada.');
    } catch (error) {
      console.error('⚠️ Error al cerrar la conexión con la base de datos:', error);
    }
  }
}

const prismaService = PrismaService.getInstance();
prismaService.connectDB();

process.on('SIGINT', async () => {
  await prismaService.disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prismaService.disconnectDB();
  process.exit(0);
});

export default prismaService;
