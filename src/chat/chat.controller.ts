import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { getMessageDto } from './chat.dto';
import { ChatService } from './chat.service';
import {Response} from 'express'

@Controller('chat')
export class ChatController {
    SERVER_URL  =  "http://localhost:5000/api/chat/"

    constructor(private readonly ChatService: ChatService){}

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @Post('getMessages')
    async getAllMessages(
        @Body() dto: getMessageDto,
        @Query('page', new DefaultValuePipe(0), ParseIntPipe) page,
        @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit
        ) {
        return this.ChatService.getAllMessages(dto, page, limit)
    }

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @Post('recordMessage')
    @UseInterceptors(FileInterceptor('recordMessage',
      {
        storage: diskStorage({
          destination: './recordMessage',
          filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('')
          return cb(null, `${randomName}${extname(file.originalname)}`)
        }
        })
      }
    )
    )
    async recordMessage(@UploadedFile() file: Express.Multer.File) {
      console.log(`${this.SERVER_URL}${file.path}`)
      return `${this.SERVER_URL}${file.path}`
    }


    @Get('recordMessage/:fileId')
    async serveAvatar(@Param('fileId') fileId, @Res() res: Response): Promise<void> {
        res.sendFile(fileId, { root: 'recordMessage'});
    }
}
