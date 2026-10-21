import { Module } from '@nestjs/common';
import { ModelsModule } from '../user/models.module';
import { FriendsService } from './friends.service';
@Module({
  imports: [ModelsModule],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
