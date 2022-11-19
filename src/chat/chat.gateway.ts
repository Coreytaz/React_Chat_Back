import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ObjectId } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { addMessageDto, getMessageDto, MessageUpdatePayload } from './chat.dto';
import { ChatService } from './chat.service'

const online = new Map()

@WebSocketGateway({ cors: true, credentials: true})
export class ChatGateway {
  constructor(private ChatService: ChatService) {}
  @WebSocketServer() server: Server;

 @SubscribeMessage('SEND-MESG')
 async handleSendMessage(client: Socket, payload: addMessageDto): Promise<void> {
  const sendUserSocketTo = online.get(payload.to)
  const newMes = await this.ChatService.addMessage(payload)
  this.server.to(String(payload.from)).emit('MESG-YOU', {...payload, id: newMes._id})
  if (sendUserSocketTo) {
    this.server.to(String(payload.to)).emit('MESG-RECIEVE', {...payload, id: newMes._id})
  }
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

@SubscribeMessage("message:update")
async handleMessagePut(
  @MessageBody()
  payload: // { id: number, message: string }
  MessageUpdatePayload
): Promise<void> {
  const updatedMessage = await this.ChatService.updateMessage(payload);
  this.server.emit('message:update-RECIEVE', {updatedMessage})
}
@SubscribeMessage("message:delete")
async handleMessageDelete(
  @MessageBody()
  payload: ObjectId // { id: number }

) {
  const removedMessage = await this.ChatService.removeMessage(payload);
  this.server.emit("message:delete-RECIEVE", {removedMessage});
}

@SubscribeMessage("messages:clear")
async handleMessagesClear(@MessageBody() dto: getMessageDto): Promise<void> {
  await this.ChatService.clearMessages(dto);
  this.server.emit("messages:clear-recieve")
}
}