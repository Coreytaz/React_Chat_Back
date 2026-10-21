import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
export type UserModelDocument = HydratedDocument<UserModel>;
@Schema({ timestamps: true })
export class UserModel {
  @Prop({ unique: true, required: true }) email!: string;
  @Prop({ unique: true, required: true }) login!: string;
  @Prop({ default: null, type: String }) avatar!: string | null;
  @Prop({ required: true }) username!: string;
  @Prop({ required: true, select: false }) password!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
export const UserModelSchema = SchemaFactory.createForClass(UserModel);
