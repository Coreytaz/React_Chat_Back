import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
export class AttachmentDto {
  @IsString() @MaxLength(256) id!: string;
  @IsUrl({ protocols: ['https'], require_protocol: true }) url!: string;
  @IsOptional() @IsIn(['done']) status?: string;
  @IsOptional() @IsString() @MaxLength(255) name?: string;
}
export class GetMessageDto {
  @IsMongoId() from!: string;
  @IsMongoId() to!: string;
}
export class AddMessageDto extends GetMessageDto {
  @IsOptional() @IsString() @MaxLength(10000) message?: string | null;
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[] = [];
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  voiceMessage?: string;
}
export class MessageUpdatePayload {
  @IsMongoId() id!: string;
  @IsString() @MaxLength(10000) message!: string;
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
export class PaginationDto {
  @Type(() => Number) @IsInt() @Min(0) page = 0;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 30;
}
