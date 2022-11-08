import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { addMessageDto, getMessageDto } from './chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly ChatService: ChatService){}

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @Post('getMessages')
    async getAllMessages(@Body() dto: getMessageDto) {
        return this.ChatService.getAllMessages(dto)
    }

    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe())
    @Post('addMessage')
    async addMessage(@Body() dto: addMessageDto) {
        return this.ChatService.addMessage(dto)
    }
}
