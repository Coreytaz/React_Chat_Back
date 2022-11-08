import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypegooseModule } from 'nestjs-typegoose';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { UserModel } from 'src/user/user.model';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatModel } from './chat.model';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: ChatModel,
        schemaOptions: {
          collection: 'Chat'
        }
      },{
        typegooseClass: UserModel,
        schemaOptions: {
          collection: 'User'
        }
      }
    ]), ConfigModule],
  providers: [ChatGateway, ChatService, JwtStrategy],
  controllers: [ChatController]
})
export class ChatModule {}
