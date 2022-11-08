import { BadRequestException, Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { InjectModel } from 'nestjs-typegoose';
import { addMessageDto, getMessageDto } from './chat.dto';
import { ChatModel } from './chat.model'

@Injectable()
export class ChatService {
    constructor(@InjectModel(ChatModel) private readonly ChatModel: ModelType<ChatModel>){}

    async getAllMessages(dto: getMessageDto) {
        const messages = await this.ChatModel.find({
            users: {
                $all: [dto.from, dto.to],
            },
        })
        .sort({updateAt: 1})
        const projectMessages = messages.map((msg) => {
            return {
                fromSelf: msg.sender.toString() === (dto.from as unknown) as string,
                message: msg.message,
            };
        })
        return projectMessages
    }
    async addMessage(dto: addMessageDto) {
        const newMessage = this.ChatModel.create({
            message: dto.message,
            users: [dto.from, dto.to],
            sender: dto.from,
        });
        (await newMessage).save()
        if (!newMessage) {
            throw new BadRequestException('Ошибка отправки сообщения')
        }
       return await newMessage
    }
}
