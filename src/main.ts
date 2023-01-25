import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser = require("cookie-parser")

async function bootstrap() {
  try {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: 'https://react-web-chat.vercel.app',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    });
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.use(
      (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.status(200).end()
          return
        }
        next()
      }
    )
    await app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
  } catch (error) {
    console.log(error);
  }
}
bootstrap();
