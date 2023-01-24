import {
  Body,
  Controller,
  Get,
  HttpCode,
  Options,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.AuthService.login(dto, response);
  }
  @HttpCode(200)
  @Options('login')
  async loginOptions(
    @Body() dto: LoginAuthDto,
    @Res() response: Response,
  ) {
    return response.status(200).end()
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register')
  async register(
    @Body() dto: CreateAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.AuthService.register(dto, response);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Get('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.AuthService.refresh(req, response);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Get('logout')
  async logout(@Res() res) {
    return this.AuthService.logout(res);
  }
}
