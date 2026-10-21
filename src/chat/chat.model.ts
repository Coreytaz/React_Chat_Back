import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
export class Attachment {
  id!: string;
  url!: string;
  status?: string;
  name?: string;
}
@Schema({ timestamps: true })
export class ChatModel {
  @Prop({ type: String, default: null }) message!: string | null;
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  users!: Types.ObjectId[];
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  sender!: Types.ObjectId[];
  @Prop({ type: String, default: null }) voiceMessage!: string | null;
  @Prop({
    type: [
      { _id: false, id: String, url: String, status: String, name: String },
    ],
    default: [],
  })
  attachments!: Attachment[];
  createdAt!: Date;
  updatedAt!: Date;
}
export const ChatModelSchema = SchemaFactory.createForClass(ChatModel);
ChatModelSchema.index({ users: 1, createdAt: -1, _id: -1 });
