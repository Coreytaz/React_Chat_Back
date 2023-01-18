import { IsNotEmpty } from 'class-validator';
import { ObjectID } from 'typeorm';

export class addMessageDto {
  @IsNotEmpty()
  message: string;

  @IsNotEmpty()
  from: ObjectID;

  @IsNotEmpty()
  to: ObjectID;

  @IsNotEmpty()
  attachments: [{ id: string; url: string }];

  voiceMessage?: string;
}

export class getMessageDto {
  @IsNotEmpty()
  from: ObjectID;

  @IsNotEmpty()
  to: ObjectID;
}

export class MessageUpdatePayload {
  @IsNotEmpty()
  id: ObjectID;

  @IsNotEmpty()
  message: string;

  @IsNotEmpty()
  attachments: [{ id: string; url: string }];
}
