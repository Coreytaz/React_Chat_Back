import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserModel } from 'src/user/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.token;
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserModel) private readonly UserModel: Repository<UserModel>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.UserModel.findOne(payload._id);

    if (!user) {
      throw new UnauthorizedException('У вас нету доступа к этой странице');
    }
    return user;
  }
}
