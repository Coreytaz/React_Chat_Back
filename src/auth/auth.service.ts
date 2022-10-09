import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ModelType} from '@typegoose/typegoose/lib/types'
import { compare, genSalt, hash } from 'bcryptjs';
import { InjectModel } from 'nestjs-typegoose';
import { UserModel } from 'src/user/user.model';
import { AuthDto } from './auth.dto';

@Injectable()
export class AuthService {
    constructor(@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>, private readonly jwtService: JwtService){}

    async login(dto: AuthDto) {
        const user = await this.validateUser(dto)

        const tokens = await this.issueTokenPair(String(user._id))

        return {
            user: this.returnUserField(user),
            ...tokens,
        }
    }

    async register(dto: AuthDto) {
        const oldUser = await this.UserModel.findOne({email: dto.email})
        if (oldUser) throw new BadRequestException('Пользователь с таким E-mail есть в системе')

        const salt = await genSalt(10)

        const newUser = new this.UserModel({email: dto.email, password: await hash(dto.password, salt)})

        await newUser.save()

        const user = await newUser

        const tokens = await this.issueTokenPair(String(user._id))

        return {
            user: this.returnUserField(user),
            ...tokens,
        }
    }

    async validateUser(dto: AuthDto) {
        const user = await this.UserModel.findOne({email: dto.email})
        if (!user) throw new UnauthorizedException('Пользователь не найден :(')

        const isValidPassword = await compare(dto.password, user.password)
        if (!isValidPassword) throw new UnauthorizedException('Не правильный пароль')

        return user
    }

    async issueTokenPair(_id: string) {
        const data = {_id}

        const accessToken = await this.jwtService.signAsync(data, {
            expiresIn: '10d'
        })

        return {accessToken}
    }

    returnUserField(user: UserModel) {
        return {
            _id: user._id,
            email: user.email
        }
    }
}
