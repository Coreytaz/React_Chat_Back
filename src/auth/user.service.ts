import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { UserModel } from '../user/user.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { AuthService } from './auth.service'
import * as fs from 'fs'
import { UpdateAuthDto } from './dto/auth.dto';



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
        return await this.UserModel.findByIdAndUpdate(req.user._id, user)
    }
}