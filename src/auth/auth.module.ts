import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModelSchema } from '../user/user.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from '../config/jwt.config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '../strategies/local.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { ReguestsModelSchema } from '../user/reguests.model';
import { FrinendsModelSchema } from '../user/friends.model';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    PassportModule,
    CloudinaryModule,
  ],
  providers: [AuthService, UserService, LocalStrategy, JwtStrategy],
  controllers: [AuthController, UserController],
})
export class AuthModule {}
