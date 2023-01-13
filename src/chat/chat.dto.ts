import { IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

export class addMessageDto {
  @IsNotEmpty()
  message: string;

  @IsNotEmpty()
  from: ObjectId;

  @IsNotEmpty()
  to: ObjectId;

  @IsNotEmpty()
  attachments: [{ id: string; url: string }];

  voiceMessage?: string;
}

export class getMessageDto {
  @IsNotEmpty()
  from: ObjectId;

  @IsNotEmpty()
  to: ObjectId;
}

export class MessageUpdatePayload {
  @IsNotEmpty()
  id: ObjectId;

  @IsNotEmpty()
  message: string;

  @IsNotEmpty()
  attachments: [{ id: string; url: string }];
}
