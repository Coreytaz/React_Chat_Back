import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import type { ServerOptions } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { corsOptions } from '../common/http';
export class AuthSocketAdapter extends IoAdapter {
  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }
  override createIOServer(
    port: number,
    options?: Partial<ServerOptions>,
  ): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: corsOptions(this.app.get(ConfigService)),
      maxHttpBufferSize: 128 * 1024,
    } as ServerOptions) as Server;
    const auth = this.app.get(AuthService);
    const origins = this.app
      .get(ConfigService)
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',');
    server.use(async (socket, next) => {
      try {
        if (
          socket.handshake.headers.origin &&
          !origins.includes(socket.handshake.headers.origin)
        )
          throw new Error('Origin denied');
        const entry = socket.handshake.headers.cookie
          ?.split(';')
          .map((v) => v.trim())
          .find((v) => v.startsWith('token='));
        const token = entry ? decodeURIComponent(entry.slice(6)) : '';
        const user = await auth.authenticate(token);
        socket.data.token = token;
        socket.data.userId = String(user._id);
        await socket.join(String(user._id));
        next();
      } catch {
        next(new Error('Требуется авторизация'));
      }
    });
    return server;
  }
}
