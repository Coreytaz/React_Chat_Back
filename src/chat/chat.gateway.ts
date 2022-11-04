import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('message')
  async handleMessage(
  @MessageBody() message: string,
  @ConnectedSocket() socket: Socket
  ): Promise<void>
  {
    this.server.emit('message', message)
  }
}
