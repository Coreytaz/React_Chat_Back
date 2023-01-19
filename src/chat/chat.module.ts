import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { FrinendsModelSchema } from 'src/user/friends.model';
import { ReguestsModelSchema } from 'src/user/reguests.model';
import { UserModelSchema } from 'src/user/user.model';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatModelSchema } from './chat.model';
import { ChatService } from './chat.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Chat', schema: ChatModelSchema, collection: 'Chat' }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserModelSchema, collection: 'User' }]),
    MongooseModule.forFeature([{ name: 'Reguests', schema: ReguestsModelSchema, collection: 'Reguests' }]),
    MongooseModule.forFeature([ { name: 'Frinends', schema: FrinendsModelSchema, collection: 'Frinends' }]),
    ConfigModule,
  ],
  providers: [ChatGateway, ChatService, JwtStrategy],
  controllers: [ChatController],
})
export class ChatModule {}
