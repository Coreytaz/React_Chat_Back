import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcryptjs';
import { UserModel, UserModelDocument } from '../user/user.model';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly UserModel: Model<UserModel>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginAuthDto, res: Response) {
    const user = await this.validateUser(dto);

    const { accessToken } = await this.issueTokenPair(String(user._id));

    res.cookie('token', accessToken, { httpOnly: true, secure: true });

    return {
      user: this.returnUserField(user),
    };
  }

  async register(dto: CreateAuthDto, res: Response) {
    const oldEmail = await this.UserModel.findOne({ email: dto.email });
    if (oldEmail)
      throw new BadRequestException(
        'Пользователь с таким E-mail или Логином есть в системе',
      );

    const oldLogin = await this.UserModel.findOne({ login: dto.login });
    if (oldLogin)
      throw new BadRequestException(
        'Пользователь с таким E-mail или Логином есть в системе',
      );

    const salt = await genSalt(10);

    const newUser = new this.UserModel({
      email: dto.email,
      login: dto.login,
      username: dto.login,
      password: await hash(dto.password, salt),
    });

    await newUser.save();

    const user = await newUser;

    const { accessToken } = await this.issueTokenPair(String(user._id));

    res.cookie('token', accessToken, { httpOnly: true, secure: true });

    return {
      user: this.returnUserField(user),
    };
  }

  async refresh(req, res: Response) {
    const dto = req.user;

    const { accessToken } = await this.issueTokenPair(String(dto._id));

    res.cookie('token', accessToken, { httpOnly: true, secure: true });

    return {
      user: this.returnUserField(dto),
    };
  }

  async logout(res: Response) {
    res.clearCookie('token');
    return res.json();
  }

  async validateUser(dto: LoginAuthDto) {
    const user = await this.UserModel.findOne({
      $or: [{ login: dto.EmailorLogin }, { email: dto.EmailorLogin }],
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден :(');
    const isValidPassword = await compare(dto.password, user.password);
    if (!isValidPassword)
      throw new UnauthorizedException('Не правильный пароль');
    return user;
  }

  async issueTokenPair(_id: string) {
    const data = { _id };

    const accessToken = await this.jwtService.signAsync(data);

    return { accessToken };
  }

  returnUserField(user: UserModelDocument) {
    return {
      _id: user._id,
      email: user.email,
      login: user.login,
      username: user.username,
      avatar: user.avatar,
    };
  }
}
