import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes,ValidationPipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UserService } from './user.service'
import { diskStorage } from  'multer';
import { extname } from  'path';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
    SERVER_URL  =  "http://localhost:5000/api/user/"
    constructor(private userService: UserService){}

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('/avatar')
    @UseInterceptors(FileInterceptor('avatar',
      {
        storage: diskStorage({
          destination: './avatars',
          filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('')
          return cb(null, `${randomName}${extname(file.originalname)}`)
        }
        })
      }
    )
    )
    async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File, @Res() res) {
      if (!file) {
        return res.status(404).json({message: "Не удалось получить файл"})
      }
        this.userService.setAvatar(req, `${this.SERVER_URL}${file.path}`, file, res);
    }

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Delete('/avatar')
    async deleteAvatar(@Req() req, @Res() res) {
        this.userService.deleteAvatar(req, res);
     }

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Patch('/me')
    async update(@Req() req, @Body() updateDto: UpdateAuthDto) {
        this.userService.updateUser(req, updateDto);
     }

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Get('/search')
    async search(@Query() dto: SearchUserDto): Promise<any> {
      return this.userService.search(dto)
    }

    @Get('avatars/:fileId')
    async serveAvatar(@Param('fileId') fileId, @Res() res): Promise<any> {
    res.sendFile(fileId, { root: 'avatars'});
  }
}
