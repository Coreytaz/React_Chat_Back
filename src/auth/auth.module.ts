import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModel } from 'src/user/user.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from 'src/config/jwt.config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from 'src/strategies/local.strategy';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { ReguestsModel } from 'src/user/reguests.model';
import { FrinendsModel } from 'src/user/friends.model';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, ReguestsModel, FrinendsModel]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule,],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    PassportModule,
  ],
  providers: [AuthService, UserService, LocalStrategy, JwtStrategy],
  controllers: [AuthController, UserController],
})
export class AuthModule {}
