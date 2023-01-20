import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModelSchema } from 'src/user/user.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from 'src/config/jwt.config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from 'src/strategies/local.strategy';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { ReguestsModelSchema } from 'src/user/reguests.model';
import { FrinendsModelSchema } from 'src/user/friends.model';

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
  ],
  providers: [AuthService, UserService, LocalStrategy, JwtStrategy],
  controllers: [AuthController, UserController],
})
export class AuthModule {}
