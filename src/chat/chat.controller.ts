import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { getMessageDto } from './chat.dto';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('chat')
export class ChatController {
  SERVER_URL = 'http://localhost:5000/api/chat/';

  constructor(
    private readonly ChatService: ChatService,
    private cloudinary: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('getMessages')
  async getAllMessages(
    @Body() dto: getMessageDto,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit,
  ) {
    return this.ChatService.getAllMessages(dto, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('recordMessage')
  @UseInterceptors(FileInterceptor('recordMessage'))
  async recordMessage(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinary.upload(file, '/recordMessage').then((result) => {
      return result.secure_url;
    });
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinary.upload(file, '/file').then((result) => {
      return result.secure_url;
    });
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Delete('file/:fileId')
  async deleteFile(@Param('fileId') fileId) {
    this.cloudinary.delete([`file/${fileId.split('.').at(0)}`]);
  }
}
