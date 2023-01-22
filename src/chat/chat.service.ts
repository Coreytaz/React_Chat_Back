import { BadRequestException, Injectable } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { RequestFriendsDto } from '../auth/dto/user.dto';
import { addMessageDto, getMessageDto, MessageUpdatePayload } from './chat.dto';
import { ChatModel } from './chat.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReguestsModelDocument } from '../user/reguests.model';
import { FrinendsModelDocument } from '../user/friends.model';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Chat') private readonly ChatModel: Model<ChatModel>,
    @InjectModel('Reguests')
    private readonly ReguestsModel: Model<ReguestsModelDocument>,
    @InjectModel('Frinends')
    private readonly FrinendsModel: Model<FrinendsModelDocument>,
    private cloudinary: CloudinaryService,
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
  async removeMessage(payload: ObjectId) {
    const msg = await this.ChatModel.findByIdAndDelete(payload);
    if (msg.voiceMessage !== null) {
      this.deleteRecordMessage(msg.voiceMessage);
    }
    if (msg.attachments.length > 0) {
      this.cloudinary.delete(
        msg.attachments.map(
          (file) => `file/${file.url.split('/').at(-1).split('.').at(0)}`,
        ),
      );
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

  async deleteRecordMessage(urlMsg: string): Promise<void> {
    await this.cloudinary.delete([
      `recordMessage/${urlMsg.split('/').at(-1).split('.').at(0)}`,
    ]);
  }
}
