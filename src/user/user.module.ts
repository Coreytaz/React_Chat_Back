import { Module } from '@nestjs/common';
import { ModelsModule } from './models.module';
import { AuthModule } from '../auth/auth.module';
import { UserController } from '../auth/user.controller';
import { UserService } from '../auth/user.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
  imports: [ModelsModule, AuthModule, CloudinaryModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
