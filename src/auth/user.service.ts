import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel } from '../user/user.model';
import { Friend } from '../user/friends.model';
import { FriendRequest } from '../user/reguests.model';
import { AuthService } from './auth.service';
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto } from './dto/user.dto';
import { referenceId, validId } from '../common/ids';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
const publicFields = { username: 1, avatar: 1 };
const literalPrefix = (value: string) =>
  new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly users: Model<UserModel>,
    @InjectModel('FriendRequest')
    private readonly requests: Model<FriendRequest>,
    @InjectModel('Friend') private readonly friends: Model<Friend>,
    private readonly auth: AuthService,
    private readonly cloud: CloudinaryService,
  ) {}
  async setAvatar(id: string, avatar: string) {
    const user = await this.users.findByIdAndUpdate(
      id,
      { avatar },
      { returnDocument: 'before' },
    );
    if (!user) throw new NotFoundException();
    if (user.avatar) await this.cloud.cleanup([user.avatar], id);
    return { message: 'Аватар успешно установлен', avatar };
  }
  async deleteAvatar(id: string) {
    const user = await this.users.findByIdAndUpdate(
      id,
      { avatar: null },
      { returnDocument: 'before' },
    );
    if (!user) throw new NotFoundException();
    if (user.avatar) await this.cloud.cleanup([user.avatar], id);
    return { message: 'Аватар успешно удален', avatar: null };
  }
  async updateUser(id: string, dto: UpdateAuthDto) {
    const user = await this.users.findByIdAndUpdate(
      id,
      { $set: dto },
      { returnDocument: 'after', runValidators: true },
    );
    if (!user) throw new NotFoundException();
    return this.auth.returnUserField(user);
  }
  async search(dto: SearchUserDto, id: string) {
    const relations = await this.requests
      .find({ $or: [{ sender: id }, { taker: id }] })
      .lean();
    const friends = await this.friends
      .find({ $or: [{ id1: id }, { id2: id }] })
      .lean();
    const related = new Set([
      ...relations.flatMap((r) => [
        referenceId(r.sender),
        referenceId(r.taker),
      ]),
      ...friends.flatMap((r) => [referenceId(r.id1), referenceId(r.id2)]),
    ]);
    const alternatives = [];
    if (dto.username)
      alternatives.push({ username: literalPrefix(dto.username) });
    if (dto.email) alternatives.push({ email: literalPrefix(dto.email) });
    const items = await this.users
      .find(
        {
          _id: { $ne: id },
          ...(alternatives.length ? { $or: alternatives } : {}),
        },
        publicFields,
      )
      .sort({ _id: 1 })
      .limit(dto.limit)
      .lean();
    return {
      items: items.map((user) => ({
        ...user,
        ...(related.has(String(user._id)) ? { friends: true } : {}),
      })),
      total: items.length,
    };
  }
  async getUser(id: string) {
    const user = await this.users.findById(validId(id), publicFields).lean();
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }
  async getRequestUser(id: string) {
    const requests = await this.requests.find({ taker: id, accept: 0 }).lean();
    return this.users
      .find(
        { _id: { $in: requests.map((r) => referenceId(r.sender)) } },
        publicFields,
      )
      .lean();
  }
  async getFriends(id: string) {
    const friends = await this.friends
      .find({ $or: [{ id1: id }, { id2: id }] })
      .lean();
    const ids = friends.map((f) =>
      referenceId(f.id1) === id ? referenceId(f.id2) : referenceId(f.id1),
    );
    return this.users.find({ _id: { $in: ids } }, publicFields).lean();
  }
}
