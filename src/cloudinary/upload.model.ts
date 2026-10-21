import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Upload {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
  owner!: Types.ObjectId;
  @Prop({ required: true, unique: true }) url!: string;
  @Prop({ required: true }) publicId!: string;
  @Prop({ required: true }) resourceType!: string;
  @Prop({ required: true }) folder!: string;
}
export const UploadSchema = SchemaFactory.createForClass(Upload);
