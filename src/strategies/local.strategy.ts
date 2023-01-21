import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LoginAuthDto } from '../auth/dto/auth.dto';
import { Strategy } from 'passport-local';
import { UserModel } from '../user/user.model';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'EmailorLogin', passReqToCallback: true });
  }

  async validate(
    req: Express.Request,
    EmailorLogin: string,
    password: string,
  ): Promise<UserModel> {
    const dto = { EmailorLogin, password } as LoginAuthDto;
    const user = this.authService.validateUser(dto);
    if (!user) {
      throw new UnauthorizedException({ message: 'Пользователь не найден :(' });
    }
    return user;
  }
}
