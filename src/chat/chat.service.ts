import { BadRequestException, Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { Schema } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { addMessageDto, getMessageDto, MessageUpdatePayload } from './chat.dto';
import { ChatModel } from './chat.model'

@Injectable()
export class ChatService {
    constructor(@InjectModel(ChatModel) private readonly ChatModel: ModelType<ChatModel>){}

    async getAllMessages(dto: getMessageDto, page:number, limit: number) {
        const messages = await this.ChatModel.find({
            users: {
                $all: [dto.from, dto.to],
            },
        }).sort({$natural:-1}).limit(limit).skip(page*limit)

        const projectMessages = messages.map((msg) => {
            return {
                id: msg._id,
                fromSelf: msg.sender.toString() === (dto.from as unknown) as string,
                message: msg.message,
            };
        }).reverse()
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
    async updateMessage(payload: MessageUpdatePayload) {
        const { id, message } = payload;
        await this.ChatModel.findByIdAndUpdate(id, {message});
        const updatedMessage = await this.ChatModel.findById(id);
        return updatedMessage
    }
    async removeMessage(payload: Schema.Types.ObjectId) {
        return this.ChatModel.findByIdAndDelete(payload)
    }
    async clearMessages(dto: getMessageDto) {
        await this.ChatModel.deleteMany({$and: [{"users.0": [dto.from, dto.to]}, {"users.1": [dto.from, dto.to]}, {"sender.0": [dto.from]}]})
    }
}
