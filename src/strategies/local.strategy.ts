import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { AuthDto } from '../auth/auth.dto';
import { Strategy } from 'passport-local';


@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
      super({ usernameField: 'emailOrLogin' , passReqToCallback: true});
  }

  async validate(req: Express.Request, emailOrLogin: string, password: string): Promise<any> {
    const _emailOrLogin = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(emailOrLogin) ? { email: emailOrLogin } : { login: emailOrLogin }
    const dto = {..._emailOrLogin, password} as AuthDto
    const user = this.authService.validateUser(dto)
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}