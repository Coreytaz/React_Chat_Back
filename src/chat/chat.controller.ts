import { Body, Controller, DefaultValuePipe, ParseIntPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { getMessageDto } from './chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
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
}
