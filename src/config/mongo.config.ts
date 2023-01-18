import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getMongoConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: "mongodb",
  url: configService.get('MONGO_URL'),
  autoLoadEntities: true,
  entities: ['src/**/*.entity.{ts,js}'],
  ssl: true,
  useUnifiedTopology: true,
  useNewUrlParser: true
});
