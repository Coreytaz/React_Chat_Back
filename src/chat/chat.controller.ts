import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthRequest } from '../common/http';
import { GetMessageDto, PaginationDto } from './chat.dto';
import { ChatService } from './chat.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly cloud: CloudinaryService,
  ) {}
  @Post('getMessages') getMessages(
    @Body() dto: GetMessageDto,
    @Query() pagination: PaginationDto,
    @Req() req: AuthRequest,
  ) {
    return this.chat.getAllMessages(
      dto,
      pagination.page,
      pagination.limit,
      String(req.user._id),
    );
  }
  @Post('recordMessage')
  @UseInterceptors(
    FileInterceptor('recordMessage', {
      limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    }),
  )
  recordMessage(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.cloud.upload(file, 'recordMessage', String(req.user._id));
  }
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadFile(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.cloud.upload(file, 'file', String(req.user._id));
  }
  @Delete('file/:fileId') async deleteFile(
    @Param('fileId') fileId: string,
    @Req() req: AuthRequest,
  ) {
    await this.cloud.removeFile(fileId, String(req.user._id));
    return { message: 'Файл удален' };
  }
}
