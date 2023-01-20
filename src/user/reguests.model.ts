import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { UserModel } from './user.model';

export type ReguestsModelDocument = ReguestsModel & Document;

export enum ACEPT_USER {
  unconfirmed = 0,
  confirmed = 1,
}
@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class ReguestsModel {
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  sender: UserModel;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  taker: UserModel;

  @Prop({ type: Number, enum: ACEPT_USER, default: [ACEPT_USER.unconfirmed] })
  accept: ACEPT_USER;

  createdAt: Date;
  updatedAt: Date;
}

export const ReguestsModelSchema = SchemaFactory.createForClass(ReguestsModel);
