import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';

export type FrinendsModelDocument = FrinendsModel & Document;

@Schema({ timestamps: true })
export class FrinendsModel {
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  id1: ObjectId;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  id2: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const FrinendsModelSchema = SchemaFactory.createForClass(FrinendsModel);
