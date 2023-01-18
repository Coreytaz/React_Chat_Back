import { BadRequestException, Injectable } from '@nestjs/common';
import { RequestFriendsDto } from 'src/auth/dto/user.dto';
import { ReguestsModel } from 'src/user/reguests.model';
import { FrinendsModel } from 'src/user/friends.model';
import { addMessageDto, getMessageDto, MessageUpdatePayload } from './chat.dto';
import { ChatModel } from './chat.model';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, ObjectID } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatModel) private readonly ChatModel: Repository<ChatModel>,
    @InjectRepository(ReguestsModel)
    private readonly ReguestsModel: Repository<ReguestsModel>,
    @InjectRepository(FrinendsModel)
    private readonly FrinendsModel: Repository<FrinendsModel>,
  ) {}

  async getAllMessages(dto: getMessageDto, page: number, limit: number) {
    const messages = await this.ChatModel.find({ where: { users: In([dto.from, dto.to]) }, order: { createdAt: 'DESC' }, skip: page * limit, take: limit });
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
      sender: [dto.from],
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
    return this.ChatModel.save({
      _id: id,
      message,
      attachments,
    });
  }
  async removeMessage(_id: ObjectID) {
    const msg = await this.ChatModel.findOne({ where: { _id }});
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
    return await this.ChatModel.delete(_id);
  }
  async clearMessages(dto: getMessageDto) {
    return await this.ChatModel.createQueryBuilder().delete().where('users = :users', { users: [dto.from, dto.to] }).execute();
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
    const oldRequest = await this.ReguestsModel.save(
      {
        sender: dto.sender,
        taker: dto.taker,
        accept: dto.accept
      },
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
