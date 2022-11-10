import { IsNotEmpty } from 'class-validator'
import { ObjectId } from 'mongoose';

export class addMessageDto {
    @IsNotEmpty()
    message: string;

    @IsNotEmpty()
    from: ObjectId;

    @IsNotEmpty()
    to: ObjectId;
}

export class getMessageDto {
    @IsNotEmpty()
    from: ObjectId;

    @IsNotEmpty()
    to: ObjectId;
}