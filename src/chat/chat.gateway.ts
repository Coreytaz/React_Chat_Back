import { HttpException } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import type { ClassConstructor } from 'class-transformer';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { RequestFriendsDto } from '../auth/dto/user.dto';
import { FriendsService } from '../friends/friends.service';
import { referenceId, validId } from '../common/ids';
import { AddMessageDto, GetMessageDto, MessageUpdatePayload } from './chat.dto';
import { ChatService } from './chat.service';
@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server!: Server;
  private readonly online = new Map<string, Set<string>>();
  constructor(
    private readonly chat: ChatService,
    private readonly auth: AuthService,
    private readonly friends: FriendsService,
  ) {}
  handleConnection(client: Socket) {
    const id = String(client.data.userId);
    const connections = this.online.get(id) ?? new Set<string>();
    connections.add(client.id);
    this.online.set(id, connections);
    this.server.emit('ADD-USER-STATUS', [...this.online.keys()]);
  }
  handleDisconnect(client: Socket) {
    const id = String(client.data.userId),
      connections = this.online.get(id);
    connections?.delete(client.id);
    if (!connections?.size) this.online.delete(id);
    this.server.emit('ADD-USER-STATUS', [...this.online.keys()]);
  }
  private async dto<T extends object>(
    type: ClassConstructor<T>,
    payload: unknown,
  ): Promise<T> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      throw new HttpException('Некорректные данные', 400);
    const dto = plainToInstance(type, payload);
    try {
      await validateOrReject(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
    } catch {
      throw new HttpException('Некорректные данные', 400);
    }
    return dto;
  }
  private async run<T>(client: Socket, operation: (id: string) => Promise<T>) {
    try {
      const user = await this.auth.authenticate(
        String(client.data.token ?? ''),
      );
      const data = await operation(String(user._id));
      return { ok: true, data };
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      const failure = {
        ok: false,
        error: {
          code: String(status),
          message:
            error instanceof HttpException
              ? error.message
              : 'Не удалось выполнить операцию',
        },
      };
      client.emit('operation:error', failure.error);
      if (status === 401) client.disconnect(true);
      return failure;
    }
  }
  @SubscribeMessage('ADD-USER') addUser(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      if (payload !== id)
        throw new HttpException('Нельзя подключиться от чужого имени', 403);
      client.emit('ADD-USER-STATUS', [...this.online.keys()]);
      return null;
    });
  }
  @SubscribeMessage('SEND-MESG') send(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      const dto = await this.dto(AddMessageDto, payload);
      const message = await this.chat.addMessage(dto, id);
      const data = {
        ...dto,
        id: message._id,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        voiceMessage: message.voiceMessage,
        attachments: message.attachments,
      };
      this.server.to(id).emit('MESG-YOU', data);
      this.server.to(dto.to).emit('MESG-RECIEVE', data);
      return data;
    });
  }
  @SubscribeMessage('message:update') update(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      const updatedMessage = await this.chat.updateMessage(
        await this.dto(MessageUpdatePayload, payload),
        id,
      );
      this.server
        .to(updatedMessage.users.map(String))
        .emit('message:update-RECIEVE', { updatedMessage });
      return updatedMessage;
    });
  }
  @SubscribeMessage('message:delete') remove(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      if (typeof payload !== 'string')
        throw new HttpException('Некорректный идентификатор', 400);
      const removedMessage = await this.chat.removeMessage(
        validId(payload),
        id,
      );
      this.server
        .to(removedMessage.users.map(String))
        .emit('message:delete-RECIEVE', { removedMessage });
      return removedMessage;
    });
  }
  @SubscribeMessage('messages:clear') clear(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      const dto = await this.dto(GetMessageDto, payload);
      await this.chat.clearMessages(dto, id);
      this.server.to([id, dto.to]).emit('messages:clear-recieve');
      return null;
    });
  }
  @SubscribeMessage('reguest:user') request(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      const request = await this.friends.request(
        await this.dto(RequestFriendsDto, payload),
        id,
      );
      if (request)
        this.server
          .to(referenceId(request.taker))
          .emit('reguest:user-recieve', { request });
      return request;
    });
  }
  @SubscribeMessage('accept:user') accept(client: Socket, payload: unknown) {
    return this.run(client, async (id) => {
      const request = await this.friends.accept(
        await this.dto(RequestFriendsDto, payload),
        id,
      );
      if (request)
        this.server
          .to([id, referenceId(request.sender)])
          .emit('accept:user-recieve', { request });
      return request;
    });
  }
}
