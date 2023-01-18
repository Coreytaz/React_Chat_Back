import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserModel } from '../user/user.model';
import { AuthService } from './auth.service';
import * as fs from 'fs';
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto } from './dto/user.dto';
import { Request } from 'express';
import { ReguestsModel } from 'src/user/reguests.model';
import { FrinendsModel } from 'src/user/friends.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Not, ObjectID, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserModel) private readonly UserModel: Repository<UserModel>,
    private readonly authService: AuthService,
    @InjectRepository(ReguestsModel)
    private readonly ReguestsModel: Repository<ReguestsModel>,
    @InjectRepository(FrinendsModel)
    private readonly FrinendsModel: Repository<FrinendsModel>,
  ) {}

  async setAvatar(req, avatarUrl: string, file: Express.Multer.File, res) {
    const userData = req.user;
    if (userData.avatar !== null) {
      fs.unlinkSync(userData.avatar.split('/').at(-1));
    }

    userData.avatar = avatarUrl;
    await userData.save();
    return res.json({
      message: 'Аватар успешно установлен',
      avatar: userData.avatar,
    });
  }

  async deleteAvatar(req, res) {
    const userData = req.user;
    if (!userData.avatar) {
      return;
    }
    fs.unlinkSync(userData.avatar.split('/').at(-1));
    userData.avatar = null;
    await userData.save();
    return res.json({
      message: 'Аватар успешно удален',
      avatar: userData.avatar,
    });
  }

  async updateUser(req, updateDto: UpdateAuthDto) {
    const user = { username: updateDto.username, email: updateDto.email };
    const findUser = await this.UserModel.findOne({
      where: { _id: req.user._id }
    });
    return await this.authService.returnUserField(await this.UserModel.save({...findUser, ...user}));
  }

  async search(dto: SearchUserDto, req) {
    console.log(dto)
    // const request = (await (await this.getRequest(req)).map((friend) => String(friend._id))) as string[];
    let qb = [] as any;
    if (dto.email || dto.username) {
      qb = await this.UserModel.find({ where: { _id: Not(req.user._id), username: Like(dto.username), email: Like(dto.email) }, select: ['_id', 'username', 'avatar'], take: dto.limit || 10 });

    } else {
      qb = await this.UserModel.find({ where: { _id: Not(req.user._id) }});
    }
    console.log(qb)
    const filterUser = qb.map((user) => {
      // if (request.includes(String(user._id))) {
      //   return {
      //     ...user.toJSON(),
      //     friends: true,
      //   };
      // }
      return user;
    });

    return {
      items: filterUser,
      total: filterUser.length,
    };
  }

  async getUser(_id: ObjectID) {
    const user = await this.UserModel.createQueryBuilder('user').select(['user._id', 'user.username', 'user.avatar']).where('_id = :id', { id: _id }).getOne();
    if (!user) {
      throw new UnauthorizedException('Ошибка чата');
    }
    return user;
  }

  async getRequestUser(req: Request) {
    const { _id } = req.user as any;
    const request = await this.ReguestsModel.find({where: { taker: _id, accept: 0 }, select: ['sender', '_id']})
    const user = [];
    for (let i = 0; i < request.length; i++) {
      user.push(await this.UserModel.findOne({ where: { _id: request[i].sender }, select: ['_id','username', 'avatar']}))
    }
    return user;
  }

  async getRequest(req: Request) {
    const { _id } = req.user as any;
    const request = await this.ReguestsModel.find({where: [ { sender: _id }, { taker: _id }]})
    const user = [];
    for (let i = 0; i < request.length; i++) {
      const id1 = request[i].sender;
      const id2 = request[i].taker;
      if (String(id1) === String(_id)) {
        user.push(
          await this.UserModel.findOne({ where: { _id: id2 }, select: ['_id','username', 'avatar']})
          );
      } else {
        user.push(
          await this.UserModel.findOne({ where: { _id: id1 }, select: ['_id','username', 'avatar']})
          );
      }
    }
    return user;
  }

  async getFriends(req: Request) {
    const { _id } = req.user as any;
    const frinends = [...await this.FrinendsModel.find({ where: { id1: _id }}), ...await this.FrinendsModel.find({ where: { id2: _id }})];
    const user = [];
    for (let i = 0; i < frinends.length; i++) {
      const id1 = frinends[i].id1;
      const id2 = frinends[i].id2;
      if (String(id1) === String(_id)) {
        user.push(
          await this.UserModel.findOne({ where: { _id: id2 }, select: ['_id','username', 'avatar']})
        );
      } else {
        user.push(
          await this.UserModel.findOne({ where: { _id: id1 }, select: ['_id','username', 'avatar']})
        );
      }
    }
    return user;
  }
}
