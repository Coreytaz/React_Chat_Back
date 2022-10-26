import { Controller, Delete, Get, HttpCode, Param, Post, Req, Res, UnauthorizedException, UploadedFile, UseInterceptors, UsePipes,ValidationPipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UserService } from './user.service'
import { diskStorage } from  'multer';
import { extname } from  'path';

@Controller('user')
export class UserController {
    SERVER_URL  =  "http://localhost:5000/api/user/"
    constructor(private userService: UserService){}

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('/avatar')
    @UseInterceptors(FileInterceptor('file',
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
        this.userService.setAvatar(req, `${this.SERVER_URL}${file.path}`, file, res);
    }

    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Delete('/avatar')
    async deleteAvatar(@Req() req, @Res() res) {
        this.userService.deleteAvatar(req, res);
     }


    @Get('avatars/:fileId')
    async serveAvatar(@Param('fileId') fileId, @Res() res): Promise<any> {
    res.sendFile(fileId, { root: 'avatars'});
  }
}
