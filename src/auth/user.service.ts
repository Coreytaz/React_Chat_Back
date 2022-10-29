import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { UserModel } from '../user/user.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { AuthService } from './auth.service'
import * as fs from 'fs'



@Injectable()
export class UserService {
    constructor(@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>, private readonly authService: AuthService) { }

    async setAvatar(req, avatarUrl: string, file: Express.Multer.File, res) {
        const authHeader = req.headers.authorization;

        const bearer = authHeader.split(' ')[0]
        const token = authHeader.split(' ')[1]

        if (bearer !== 'Bearer' || !token) {
            throw new UnauthorizedException('Не верный токен');
        }
        const userData = this.authService.validateAccessToken(token)
        if (!userData) {
            fs.unlinkSync(file.path)
            return res.status(403).json({message: "Не удалось авторизоваться"})
        }
        const user = await this.authService.findToken(userData._id)
        if (!user) {
            fs.unlinkSync(file.path)
            return res.status(403).json({message: "Не удалось найти пользователь"})
        }
        if (user.avatar !== null) {
            fs.unlinkSync(user.avatar.split('/').at(-1))
        }

        user.avatar = avatarUrl
        await user.save()
        return res.json({message: "Аватар успешно установлен"})
    }

    async deleteAvatar(req, res) {
        const authHeader = req.headers.authorization;

        const bearer = authHeader.split(' ')[0]
        const token = authHeader.split(' ')[1]

        if (bearer !== 'Bearer' || !token) {
            throw new UnauthorizedException('Не верный токен');
        }
        const userData = this.authService.validateAccessToken(token)
        if (!userData) {
            return res.status(403).json({message: "Не удалось авторизоваться"})
        }
        const user = await this.authService.findToken(userData._id)
        if (!user) {
            return res.status(403).json({message: "Не удалось найти пользователь"})
        }
        if (!user.avatar) {
            return
        }
        fs.unlinkSync(user.avatar.split('/').at(-1))
        user.avatar = null
        await user.save()
        return res.json({message: "Аватар успешно удален"})
    }
}