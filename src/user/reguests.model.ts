import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  sender!: Types.ObjectId[];
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  taker!: Types.ObjectId[];
  @Prop({ type: Number, enum: [0, 1], default: 0 }) accept!: number;
  @Prop({ type: String }) pairKey?: string;
}
export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
FriendRequestSchema.index({ pairKey: 1 }, { unique: true, sparse: true });
