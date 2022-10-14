import { Body, Controller, Get, HttpCode, Post, Req, Res, UsePipes,ValidationPipe } from '@nestjs/common';
import { AuthDto } from './auth.dto'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
    constructor(private readonly AuthService: AuthService){}

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('login')
    async login(@Body() dto: AuthDto) {
        return this.AuthService.login(dto)
    }
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('register')
    async register(@Body() dto: AuthDto) {
        return this.AuthService.register(dto)
    }

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Get('refresh')
    async refresh(@Req() req) {
        return this.AuthService.refresh(req)
    }
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Get('logout')
    async logout(@Res() res) {
        return this.AuthService.logout(res)
    }
}
