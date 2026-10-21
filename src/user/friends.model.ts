import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Friend {
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  id1!: Types.ObjectId[];
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  id2!: Types.ObjectId[];
  @Prop({ type: String }) pairKey?: string;
}
export const FriendSchema = SchemaFactory.createForClass(Friend);
FriendSchema.index({ pairKey: 1 }, { unique: true, sparse: true });
