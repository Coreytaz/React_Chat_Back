import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './common/http';
import { AuthSocketAdapter } from './chat/auth-socket.adapter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  configureApp(app);
  app.useWebSocketAdapter(new AuthSocketAdapter(app));
  await app.listen(
    app.get(ConfigService).getOrThrow<number>('PORT'),
    '127.0.0.1',
  );
}
void bootstrap().catch(() => {
  console.error(
    'Backend startup failed. Check environment configuration and MongoDB connectivity.',
  );
  process.exitCode = 1;
});
