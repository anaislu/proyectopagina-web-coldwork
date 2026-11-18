import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_ENV, type AppEnv } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get<AppEnv>(APP_ENV);
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableCors({ origin: env.corsOrigins.length ? env.corsOrigins : false });
  app.enableShutdownHooks();
  await app.listen(env.port, '0.0.0.0');
}
void bootstrap();
