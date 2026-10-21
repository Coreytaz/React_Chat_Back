import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import type { CookieOptions, Response } from 'express';
import { Model } from 'mongoose';
import { UserModel } from '../user/user.model';
import type { UserModelDocument } from '../user/user.model';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly users: Model<UserModel>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE') === 'true',
      sameSite: this.config.get('COOKIE_SECURE') === 'true' ? 'none' : 'lax',
      path: '/',
    };
  }
  private async session(user: UserModelDocument, res: Response) {
    const token = await this.jwt.signAsync({ _id: String(user._id) });
    res.cookie('token', token, { ...this.cookieOptions(), maxAge: 86400000 });
    return { user: this.returnUserField(user) };
  }
  async register(dto: CreateAuthDto, res: Response) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72)
      throw new BadRequestException('Пароль превышает 72 байта');
    if (
      await this.users.exists({
        $or: [{ email: dto.email }, { login: dto.login }],
      })
    )
      throw new BadRequestException('Email или логин уже занят');
    const user = await this.users.create({
      ...dto,
      username: dto.login,
      password: await hash(dto.password, 10),
    });
    return this.session(user, res);
  }
  async login(dto: LoginAuthDto, res: Response) {
    const user = await this.users
      .findOne({
        $or: [{ login: dto.EmailorLogin }, { email: dto.EmailorLogin }],
      })
      .select('+password');
    if (!user || !(await compare(dto.password, user.password)))
      throw new UnauthorizedException('Неверный логин или пароль');
    return this.session(user, res);
  }
  refresh(user: UserModelDocument, res: Response) {
    return this.session(user, res);
  }
  logout(res: Response) {
    res.clearCookie('token', this.cookieOptions());
    return { message: 'Вы вышли из системы' };
  }
  async authenticate(token: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ _id: string }>(token);
      if (!/^[a-f0-9]{24}$/i.test(payload._id))
        throw new Error('Invalid subject');
      const user = await this.users.findById(payload._id);
      if (!user) throw new Error('User missing');
      return user;
    } catch {
      throw new UnauthorizedException('Требуется авторизация');
    }
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
