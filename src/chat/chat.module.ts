import { Module } from '@nestjs/common';
import { ModelsModule } from '../user/models.module';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { FriendsModule } from '../friends/friends.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
@Module({
  imports: [ModelsModule, AuthModule, CloudinaryModule, FriendsModule],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
