import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friend } from '../user/friends.model';
import { FriendRequest } from '../user/reguests.model';
import { UserModel } from '../user/user.model';
import { RequestFriendsDto } from '../auth/dto/user.dto';
@Injectable()
export class FriendsService {
  constructor(
    @InjectModel('FriendRequest')
    private readonly requests: Model<FriendRequest>,
    @InjectModel('Friend') private readonly friends: Model<Friend>,
    @InjectModel('User') private readonly users: Model<UserModel>,
  ) {}
  private async pair(dto: RequestFriendsDto) {
    if (dto.sender === dto.taker)
      throw new BadRequestException('Нельзя добавить себя');
    if (
      !(await this.users.exists({ _id: dto.sender })) ||
      !(await this.users.exists({ _id: dto.taker }))
    )
      throw new NotFoundException('Пользователь не найден');
    return [dto.sender, dto.taker].sort().join(':');
  }
  private relation(dto: RequestFriendsDto) {
    return {
      $or: [
        { id1: dto.sender, id2: dto.taker },
        { id1: dto.taker, id2: dto.sender },
      ],
    };
  }
  async request(dto: RequestFriendsDto, actor: string) {
    if (dto.sender !== actor)
      throw new ForbiddenException(
        'Нельзя отправить запрос от другого пользователя',
      );
    const pairKey = await this.pair(dto);
    if (await this.friends.exists(this.relation(dto)))
      throw new BadRequestException('Пользователь уже в друзьях');
    const existing = await this.requests.findOne({
      $or: [
        { sender: dto.sender, taker: dto.taker },
        { sender: dto.taker, taker: dto.sender },
      ],
    });
    if (existing) return existing;
    try {
      return await this.requests.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: { sender: [dto.sender], taker: [dto.taker], accept: 0 },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        return this.requests.findOne({ pairKey });
      throw error;
    }
  }
  async accept(dto: RequestFriendsDto, actor: string) {
    if (dto.taker !== actor)
      throw new ForbiddenException('Только получатель может принять запрос');
    if (dto.accept !== 1) throw new BadRequestException('Ожидается accept: 1');
    const pairKey = await this.pair(dto);
    const request = await this.requests.findOne({
      sender: dto.sender,
      taker: dto.taker,
    });
    if (!request) throw new NotFoundException('Запрос не найден');
    if (!(await this.friends.exists(this.relation(dto)))) {
      try {
        await this.friends.updateOne(
          { pairKey },
          { $setOnInsert: { id1: [dto.sender], id2: [dto.taker] } },
          { upsert: true, runValidators: true },
        );
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    return this.requests.findByIdAndUpdate(
      request._id,
      { accept: 1 },
      { returnDocument: 'after' },
    );
  }
}
