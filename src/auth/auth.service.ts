import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcryptjs';
import { InjectRepository  } from '@nestjs/typeorm';
import { UserModel } from 'src/user/user.model';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserModel) private UserModel: Repository<UserModel>,
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
    const oldEmail = await this.UserModel.findOne({ where:
        { email: dto.email }
    });
    if (oldEmail)
      throw new BadRequestException(
        'Пользователь с таким E-mail или Логином есть в системе',
      );

    const oldLogin = await this.UserModel.findOne({ where: { login: dto.login }});
    if (oldLogin)
      throw new BadRequestException(
        'Пользователь с таким E-mail или Логином есть в системе',
      );

    const salt = await genSalt(10);

    const newUser = this.UserModel.create({
      email: dto.email,
      login: dto.login,
      username: dto.login,
      avatar: null,
      password: await hash(dto.password, salt),
    });
    await newUser.save();

    const { accessToken } = await this.issueTokenPair(String(newUser._id));
    res.cookie('token', accessToken, { httpOnly: true, secure: true });

    return {
      user: this.returnUserField(newUser)
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
    const login = await this.UserModel.findOneBy({ login: dto.EmailorLogin });
    const email = await this.UserModel.findOneBy({ email: dto.EmailorLogin });
    const user = login || email;
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

  returnUserField(user: UserModel) {
    return {
      _id: user._id,
      email: user.email,
      login: user.login,
      username: user.username,
      avatar: user.avatar,
    };
  }
}
