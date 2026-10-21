import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Request } from 'express';
import { UserModel } from '../user/user.model';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel('User') private readonly users: Model<UserModel>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = req?.cookies as Record<string, unknown> | undefined;
          return typeof cookies?.token === 'string' ? cookies.token : null;
        },
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }
  async validate(payload: { _id?: string }) {
    if (!payload._id || !/^[a-f0-9]{24}$/i.test(payload._id))
      throw new UnauthorizedException();
    const user = await this.users.findById(payload._id);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
