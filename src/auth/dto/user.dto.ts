import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class SearchUserDto {
  @IsOptional() @IsString() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(64) username?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 10;
}
export class UserQueryDto {
  @IsMongoId() _id!: string;
}
export class RequestFriendsDto {
  @IsMongoId() sender!: string;
  @IsMongoId() taker!: string;
  @IsOptional() @IsIn([0, 1]) accept?: number;
}
