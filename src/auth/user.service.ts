import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { UserModel } from '../user/user.model';
import { ModelType } from '@typegoose/typegoose/lib/types';


@Injectable()
export class UserService {
    constructor(@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>) { }

    async setAvatar(userId: number, avatarUrl: string){
        console.log(userId, avatarUrl)
        const user = await this.UserModel.findById(userId)
        user.avatar = avatarUrl
        await user.save()
    }
}