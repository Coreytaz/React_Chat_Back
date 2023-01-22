import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserModel } from '../user/user.model';
import { AuthService } from './auth.service';
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto } from './dto/user.dto';
import { Model, Schema } from 'mongoose';
import { Request } from 'express';
import { ReguestsModel } from '../user/reguests.model';
import { FrinendsModel } from '../user/friends.model';
import { InjectModel } from '@nestjs/mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const regex = (string: string): RegExp => {
  return new RegExp(`^${string}`, 'g');
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly UserModel: Model<UserModel>,
    private readonly authService: AuthService,
    @InjectModel('Reguests')
    private readonly ReguestsModel: Model<ReguestsModel>,
    @InjectModel('Frinends')
    private readonly FrinendsModel: Model<FrinendsModel>,
  ) {}

  async setAvatar(req, avatarUrl: string, res) {
    const userData = req.user;
    userData.avatar = avatarUrl;
    await userData.save();
    return res.json({
      message: 'Аватар успешно установлен',
      avatar: userData.avatar,
    });
  }

  async deleteAvatar(req, res, cloudinary: CloudinaryService) {
    const userData = req.user;
    if (!userData.avatar) {
      return;
    }
    await cloudinary.delete([
      `avatars/${userData.avatar.split('/').at(-1).split('.').at(0)}`,
    ]);
    userData.avatar = null;
    await userData.save();
    return res.json({
      message: 'Аватар успешно удален',
      avatar: userData.avatar,
    });
  }

  async updateUser(req, updateDto: UpdateAuthDto) {
    const user = { username: updateDto.username, email: updateDto.email };
    return await this.authService.returnUserField(
      await this.UserModel.findByIdAndUpdate(req.user._id, user),
    );
  }

  async search(dto: SearchUserDto, req) {
    const request = (await (
      await this.getRequest(req)
    ).map((friend) => String(friend._id))) as string[];
    let qb = [];
    if (dto.email || dto.username) {
      qb = await this.UserModel.find(
        {
          _id: { $ne: req.user._id },
          $or: [{ username: regex(dto.username) }, { email: regex(dto.email) }],
        },
        { username: true, avatar: true },
      ).limit(dto.limit || 10);
    } else {
      qb = await this.UserModel.find(
        { _id: { $ne: req.user._id } },
        { username: true, avatar: true },
      ).limit(dto.limit || 10);
    }
    const filterUser = qb.map((user) => {
      if (request.includes(String(user._id))) {
        return {
          ...user.toJSON(),
          friends: true,
        };
      }
      return user;
    });

    return {
      items: filterUser,
      total: filterUser.length,
    };
  }

  async getUser(_id: Schema.Types.ObjectId) {
    const user = await this.UserModel.findById(_id, {
      username: true,
      avatar: true,
    });
    if (!user) {
      throw new UnauthorizedException('Ошибка чата');
    }
    return user;
  }

  async getRequestUser(req: Request) {
    const { _id } = req.user as any;
    const request = await this.ReguestsModel.find(
      { taker: _id, accept: 0 },
      { sender: true },
    );
    const user = [];
    for (let i = 0; i < request.length; i++) {
      user.push(
        await this.UserModel.findById(request[i].sender, {
          username: true,
          avatar: true,
        }),
      );
    }
    return user;
  }

  async getRequest(req: Request) {
    const { _id } = req.user as any;
    const request = await this.ReguestsModel.find({
      $or: [{ sender: _id }, { taker: _id }],
    });
    const user = [];
    for (let i = 0; i < request.length; i++) {
      const id1 = request[i].sender;
      const id2 = request[i].taker;
      if (String(id1) === String(_id)) {
        user.push(
          await this.UserModel.findById(id2, { username: true, avatar: true }),
        );
      } else {
        user.push(
          await this.UserModel.findById(id1, { username: true, avatar: true }),
        );
      }
    }
    return user;
  }

  async getFriends(req: Request) {
    const { _id } = req.user as any;
    const frinends = await this.FrinendsModel.find({
      $or: [{ id1: _id }, { id2: _id }],
    });
    const user = [];
    for (let i = 0; i < frinends.length; i++) {
      const id1 = frinends[i].id1;
      const id2 = frinends[i].id2;
      if (String(id1) === String(_id)) {
        user.push(
          await this.UserModel.findById(id2, { username: true, avatar: true }),
        );
      } else {
        user.push(
          await this.UserModel.findById(id1, { username: true, avatar: true }),
        );
      }
    }
    return user;
  }
}
