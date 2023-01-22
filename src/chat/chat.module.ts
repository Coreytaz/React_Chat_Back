import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { FrinendsModelSchema } from '../user/friends.model';
import { ReguestsModelSchema } from '../user/reguests.model';
import { UserModelSchema } from '../user/user.model';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatModelSchema } from './chat.model';
import { ChatService } from './chat.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Chat', schema: ChatModelSchema, collection: 'Chat' },
    ]),
    MongooseModule.forFeature([
      { name: 'User', schema: UserModelSchema, collection: 'User' },
    ]),
    MongooseModule.forFeature([
      { name: 'Reguests', schema: ReguestsModelSchema, collection: 'Reguests' },
    ]),
    MongooseModule.forFeature([
      { name: 'Frinends', schema: FrinendsModelSchema, collection: 'Frinends' },
    ]),
    ConfigModule,
    CloudinaryModule,
  ],
  providers: [ChatGateway, ChatService, JwtStrategy],
  controllers: [ChatController],
})
export class ChatModule {}
