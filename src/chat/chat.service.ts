import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatModel } from './chat.model';
import type { Attachment } from './chat.model';
import { UserModel } from '../user/user.model';
import { AddMessageDto, GetMessageDto, MessageUpdatePayload } from './chat.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { referenceId, validId } from '../common/ids';
@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Chat') private readonly messages: Model<ChatModel>,
    @InjectModel('User') private readonly users: Model<UserModel>,
    private readonly cloud: CloudinaryService,
  ) {}
  private actor(dto: GetMessageDto, actor: string) {
    validId(dto.from);
    validId(dto.to);
    if (dto.from !== actor)
      throw new ForbiddenException('Нет доступа к переписке');
    if (dto.from === dto.to)
      throw new BadRequestException('Выберите другого пользователя');
  }
  async getAllMessages(
    dto: GetMessageDto,
    page: number,
    limit: number,
    actor: string,
  ) {
    this.actor(dto, actor);
    const messages = await this.messages
      .find({ users: { $all: [dto.from, dto.to], $size: 2 } })
      .sort({ createdAt: -1, _id: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();
    return messages
      .reverse()
      .map((msg) => ({
        id: msg._id,
        fromSelf: referenceId(msg.sender) === actor,
        message: msg.message,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        voiceMessage: msg.voiceMessage,
        attachments: msg.attachments,
      }));
  }
  private content(
    message: string | null | undefined,
    attachments: Attachment[],
    voice?: string | null,
  ) {
    if (!message?.trim() && !attachments.length && !voice)
      throw new BadRequestException('Сообщение пустое');
  }
  async addMessage(dto: AddMessageDto, actor: string) {
    this.actor(dto, actor);
    this.content(dto.message, dto.attachments, dto.voiceMessage);
    if (!(await this.users.exists({ _id: dto.to })))
      throw new NotFoundException('Получатель не найден');
    await this.cloud.assertOwned(
      [
        ...dto.attachments.map((a) => a.url),
        ...(dto.voiceMessage ? [dto.voiceMessage] : []),
      ],
      actor,
    );
    return this.messages.create({
      message: dto.message ?? null,
      users: [actor, dto.to],
      sender: [actor],
      voiceMessage: dto.voiceMessage ?? null,
      attachments: dto.attachments,
    });
  }
  private async owned(id: string, actor: string) {
    const message = await this.messages.findById(validId(id));
    if (!message) throw new NotFoundException('Сообщение не найдено');
    if (referenceId(message.sender) !== actor)
      throw new ForbiddenException('Можно изменять только свои сообщения');
    return message;
  }
  async updateMessage(dto: MessageUpdatePayload, actor: string) {
    const message = await this.owned(dto.id, actor);
    const attachments = dto.attachments ?? message.attachments;
    this.content(dto.message, attachments, message.voiceMessage);
    await this.cloud.assertOwned(
      attachments.map((a) => a.url),
      actor,
      message.attachments.map((a) => a.url),
    );
    const removed = message.attachments
      .filter((a) => !attachments.some((next) => next.url === a.url))
      .map((a) => a.url);
    const updated = await this.messages.findOneAndUpdate(
      { _id: dto.id, sender: actor },
      { message: dto.message, attachments },
      { returnDocument: 'after', runValidators: true },
    );
    if (!updated) throw new NotFoundException('Сообщение не найдено');
    await this.cloud.cleanup(removed, actor);
    return updated;
  }
  async removeMessage(id: string, actor: string) {
    const message = await this.owned(id, actor);
    const removed = await this.messages.findOneAndDelete({
      _id: message._id,
      sender: actor,
    });
    if (!removed) throw new NotFoundException('Сообщение не найдено');
    await this.cloud.cleanup(
      [
        ...removed.attachments.map((a) => a.url),
        ...(removed.voiceMessage ? [removed.voiceMessage] : []),
      ],
      actor,
    );
    return removed;
  }
  async clearMessages(dto: GetMessageDto, actor: string) {
    this.actor(dto, actor);
    const messages = await this.messages.find({
      users: { $all: [actor, dto.to], $size: 2 },
      sender: actor,
    });
    // Delete exactly the captured documents so concurrent new messages are preserved.
    await this.messages.deleteMany({
      _id: { $in: messages.map((m) => m._id) },
      sender: actor,
    });
    await this.cloud.cleanup(
      messages.flatMap((m) => [
        ...m.attachments.map((a) => a.url),
        ...(m.voiceMessage ? [m.voiceMessage] : []),
      ]),
      actor,
    );
  }
}
