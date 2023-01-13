import { BadRequestException, Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { Schema } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { RequestFriendsDto } from 'src/auth/dto/user.dto';
import { ReguestsModel } from 'src/user/reguests.model';
import { FrinendsModel } from 'src/user/friends.model';
import { addMessageDto, getMessageDto, MessageUpdatePayload } from './chat.dto';
import { ChatModel } from './chat.model';
import * as fs from 'fs';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatModel) private readonly ChatModel: ModelType<ChatModel>,
    @InjectModel(ReguestsModel)
    private readonly ReguestsModel: ModelType<ReguestsModel>,
    @InjectModel(FrinendsModel)
    private readonly FrinendsModel: ModelType<FrinendsModel>,
  ) {}

  async getAllMessages(dto: getMessageDto, page: number, limit: number) {
    const messages = await this.ChatModel.find({
      users: {
        $all: [dto.from, dto.to],
      },
    })
      .sort({ $natural: -1 })
      .limit(limit)
      .skip(page * limit);

    const projectMessages = messages
      .map((msg) => {
        return {
          id: msg._id,
          fromSelf: msg.sender.toString() === (dto.from as unknown as string),
          message: msg.message,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          voiceMessage: msg.voiceMessage,
          attachments: msg.attachments,
        };
      })
      .reverse();
    return projectMessages;
  }
  async addMessage(dto: addMessageDto) {
    const newMessage = this.ChatModel.create({
      message: dto.message,
      users: [dto.from, dto.to],
      sender: dto.from,
      voiceMessage: dto.voiceMessage,
      attachments: dto.attachments,
    });
    (await newMessage).save();
    if (!newMessage) {
      throw new BadRequestException('Ошибка отправки сообщения');
    }
    return await newMessage;
  }
  async updateMessage(payload: MessageUpdatePayload) {
    const { id, message, attachments } = payload;
    await this.ChatModel.findByIdAndUpdate(id, { message, attachments });
    const updatedMessage = await this.ChatModel.findById(id);
    return updatedMessage;
  }
  async removeMessage(payload: Schema.Types.ObjectId) {
    const msg = await this.ChatModel.findByIdAndDelete(payload);
    if (msg.voiceMessage !== null) {
      this.deleteRecordMessage(msg.voiceMessage);
    }
    if (msg.attachments.length > 0) {
      msg.attachments.forEach((file) => {
        try {
          this.deleteFile(file.url);
        } catch (e) {
          return;
        }
      });
    }
    return msg;
  }
  async clearMessages(dto: getMessageDto) {
    await this.ChatModel.deleteMany({
      $and: [
        { 'users.0': [dto.from, dto.to] },
        { 'users.1': [dto.from, dto.to] },
        { 'sender.0': [dto.from] },
      ],
    });
  }

  async requestFriends(dto: RequestFriendsDto) {
    const newRequest = this.ReguestsModel.create({
      sender: dto.sender,
      taker: dto.taker,
      accept: 0,
    });
    (await newRequest).save();
    if (!newRequest) {
      throw new BadRequestException('Ошибка отправки запроса');
    }
    return await newRequest;
  }

  async acceptFriends(dto: RequestFriendsDto) {
    const oldRequest = await this.ReguestsModel.findOneAndUpdate(
      {
        sender: dto.sender,
        taker: dto.taker,
      },
      { accept: dto.accept },
    );
    const addToFriends = await this.FrinendsModel.create({
      id1: dto.sender,
      id2: dto.taker,
    });
    (await addToFriends).save();
    if (!addToFriends) {
      throw new BadRequestException('Ошибка принятие запроса');
    }
    return await oldRequest;
  }

  deleteRecordMessage(urlMsg: string): void {
    fs.unlinkSync(urlMsg.split('/').at(-1));
  }

  deleteFile(file: string): void {
    fs.unlinkSync(file.split('/').at(-1));
  }
}
