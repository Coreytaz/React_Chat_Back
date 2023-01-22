import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    });
    app.setGlobalPrefix('api');
    // app.use(cookieParser());

    await app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
  } catch (error) {
    console.log(error);
  }
}
bootstrap();
