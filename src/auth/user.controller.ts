import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, UsePipes,ValidationPipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UserService } from './user.service'
import { diskStorage } from  'multer';
import { extname } from  'path';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto } from './dto/user.dto';
import { UserModel } from 'src/user/user.model';
import { ObjectId } from 'mongoose';
import { Request } from 'express'


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
        return res.status(404).json({error: "Error",message: "Не удалось получить файл"})
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
      return this.userService.updateUser(req, updateDto);
     }

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Get('/search')
    async search(@Query() dto: SearchUserDto, @Req() req)
    {
      return this.userService.search(dto, req)
    }

    @Get('avatars/:fileId')
    async serveAvatar(@Param('fileId') fileId, @Res() res): Promise<any> {
    res.sendFile(fileId, { root: 'avatars'});
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Get('getUser')
  async getUsers(@Query() sel: ObjectId) {
      return this.userService.getUser(sel)
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Get('getReguestUser')
  async getRequestUser(@Req() req: Request) {
      return this.userService.getRequestUser(req)
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Get('getFriends')
  async getFriends(@Req() req: Request) {
      return this.userService.getFriends(req)
  }
}
