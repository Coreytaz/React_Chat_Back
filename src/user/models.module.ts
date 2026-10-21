import { Module } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel, UserModelSchema } from './user.model';
import { Friend, FriendSchema } from './friends.model';
import { FriendRequest, FriendRequestSchema } from './reguests.model';
import { ChatModelSchema } from '../chat/chat.model';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserModelSchema, collection: 'User' },
      { name: 'Friend', schema: FriendSchema, collection: 'Frinends' },
      {
        name: 'FriendRequest',
        schema: FriendRequestSchema,
        collection: 'Reguests',
      },
      { name: 'Chat', schema: ChatModelSchema, collection: 'Chat' },
    ]),
  ],
  exports: [MongooseModule],
})
export class ModelsModule implements OnModuleInit {
  constructor(
    @InjectModel('User') private readonly users: Model<UserModel>,
    @InjectModel('Friend') private readonly friends: Model<Friend>,
    @InjectModel('FriendRequest')
    private readonly requests: Model<FriendRequest>,
  ) {}
  async onModuleInit() {
    // Accept requests only once uniqueness constraints are ready.
    await Promise.all([
      this.users.init(),
      this.friends.init(),
      this.requests.init(),
    ]);
  }
}
