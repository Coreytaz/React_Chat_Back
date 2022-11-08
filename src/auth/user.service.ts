import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { UserModel } from '../user/user.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { AuthService } from './auth.service'
import * as fs from 'fs'
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto } from './dto/user.dto';
import { Schema } from 'mongoose';

const regex = (string: string):RegExp => {
    return new RegExp(`^${string}`,"g");
}

@Injectable()
export class UserService {
    constructor(@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>, private readonly authService: AuthService) { }

    async setAvatar(req, avatarUrl: string, file: Express.Multer.File, res) {
        const userData = req.user
        if (userData.avatar !== null) {
            fs.unlinkSync(userData.avatar.split('/').at(-1))
        }

        userData.avatar = avatarUrl
        await userData.save()
        return res.json({message: "Аватар успешно установлен", avatar: userData.avatar})
    }

    async deleteAvatar(req, res) {
        const userData = req.user
        if (!userData.avatar) {
            return
        }
        fs.unlinkSync(userData.avatar.split('/').at(-1))
        userData.avatar = null
        await userData.save()
        return res.json({message: "Аватар успешно удален", avatar: userData.avatar})
    }

    async updateUser(req, updateDto: UpdateAuthDto) {
        const user = {username: updateDto.username, email: updateDto.email}
        return await this.authService.returnUserField(await this.UserModel.findByIdAndUpdate(req.user._id, user))
    }

    async search(dto: SearchUserDto, req) {
        console.log(req.user)
        if (dto.email || dto.username) {
            const qb = await this.UserModel.find({_id : { $ne:req.user._id }, $or : [{username: regex(dto.username)}, {email: regex(dto.email)}]}, {username: true, email: true, avatar: true}).limit(dto.limit || 10)
            return {
                items: qb,
                total: qb.length
            }
        }
        const qb = await this.UserModel.find({_id : { $ne:req.user._id }}, {username: true, email: true, avatar: true}).limit(dto.limit || 10)
        return {
            items: qb,
            total: qb.length
        }
    }

    async getUser(_id: Schema.Types.ObjectId) {
        const user = await this.UserModel.findById(_id, {username: true, avatar: true})
        if (!user) {
            throw new BadRequestException('Ошибка чата')
        }
        return user
      }
}