import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModel } from 'src/user/user.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from 'src/config/jwt.config';

@Module({
  imports: [TypegooseModule.forFeature([
    {
      typegooseClass: UserModel,
      schemaOptions: {
        collection: 'User'
      }
    }
  ]),
  ConfigModule,
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getJwtConfig
  }),
],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
