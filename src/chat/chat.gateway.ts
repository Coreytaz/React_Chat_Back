import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
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
  const sendUserSocket = online.get(payload.to)
  console.log(payload)
  if (sendUserSocket) {
   await this.ChatService.addMessage(payload);
   this.server.to(sendUserSocket).emit('MESG-RECIEVE', payload.message)

  }
 }

 handleConnection(client: Socket, ...args: any[]) {
  console.log(`Connected ${client.id}`);
  console.log(online)
}

 @SubscribeMessage('ADD-USER')
 async addUser(client: Socket, _id: ObjectId) {
  console.log(_id)
  online.set(_id, client.id);
  console.log(online)
 }
}
