import {
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import type {
  ArgumentsHost,
  ExceptionFilter,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import type { UserModelDocument } from '../user/user.model';

export type AuthRequest = Request & { user: UserModelDocument };
export function corsOptions(config: ConfigService) {
  return {
    origin: config.getOrThrow<string>('CORS_ORIGINS').split(','),
    credentials: true,
  };
}
export function validationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableCors(corsOptions(app.get(ConfigService)));
  app.use(cookieParser());
  app.useGlobalPipes(validationPipe());
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.enableShutdownHooks();
}

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException)
      return response
        .status(error.getStatus())
        .json(
          typeof error.getResponse() === 'string'
            ? { statusCode: error.getStatus(), message: error.getResponse() }
            : error.getResponse(),
        );
    const dbError = error as { code?: number; name?: string };
    if (dbError?.code === 11000)
      return response
        .status(HttpStatus.CONFLICT)
        .json({ statusCode: 409, message: 'Email или логин уже занят' });
    if (dbError?.name === 'CastError' || dbError?.name === 'ValidationError') {
      return response
        .status(400)
        .json(new BadRequestException('Некорректные данные').getResponse());
    }
    return response
      .status(500)
      .json({ statusCode: 500, message: 'Внутренняя ошибка сервера' });
  }
}
