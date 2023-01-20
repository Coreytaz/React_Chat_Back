import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserModelDocument = UserModel & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class UserModel {
  @Prop({ unique: true })
  email: string;

  @Prop({ unique: true })
  login: string;

  @Prop({ default: null })
  avatar: string;

  @Prop()
  username: string;

  @Prop()
  password: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserModelSchema = SchemaFactory.createForClass(UserModel);
