import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';

export type ChatModelDocument = ChatModel & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class ChatModel {
  @Prop({ require: true })
  message: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    require: true,
  })
  users: ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    require: true,
  })
  sender: ObjectId[];

  @Prop({ default: null })
  voiceMessage?: string;

  @Prop({ default: [] })
  attachments?: [{ id: string; url: string }];

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ChatModelSchema = SchemaFactory.createForClass(ChatModel);
