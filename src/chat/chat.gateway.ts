import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ObjectId } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { addMessageDto } from './chat.dto';
import { ChatService } from './chat.service'

const online = new Map()

@WebSocketGateway({ cors: true, credentials: true})
export class ChatGateway {
  constructor(private ChatService: ChatService) {}
  @WebSocketServer() server: Server;

 @SubscribeMessage('SEND-MESG')
 async handleSendMessage(client: Socket, payload: addMessageDto): Promise<void> {
  const sendUserSocketTo = online.get(payload.to)
  if (sendUserSocketTo) {
    this.server.to(String(payload.to)).emit('MESG-RECIEVE', {...payload})
  }
  await this.ChatService.addMessage(payload)
 }

 handleConnection(client: Socket) {
  console.log(`Connected ${client.id}`);
}

handleDisconnect(client: Socket) {
  online.forEach((value, _id) => {
    if (value === client.id) {
      online.delete(_id)
    }
})
  const users = [...online.keys()]
  this.server.emit('ADD-USER-STATUS', users)
  console.log(`Disconnected: ${client.id}`);
}

 @SubscribeMessage('ADD-USER')
 async addUser(client: Socket, _id: ObjectId) {
  client.join(String(_id))
  online.set(_id, client.id);
  const users = [...online.keys()]
  await this.server.emit('ADD-USER-STATUS', users)
 }
}
