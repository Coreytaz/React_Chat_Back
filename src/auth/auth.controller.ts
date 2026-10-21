import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthRequest } from '../common/http';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginAuthDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto, res);
  }
  @Post('register')
  @HttpCode(200)
  register(
    @Body() dto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.register(dto, res);
  }
  @Get('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req.user, res);
  }
  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.auth.logout(res);
  }
}
