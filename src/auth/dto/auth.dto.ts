import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class CreateAuthDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(3) @MaxLength(64) login!: string;
  @IsString() @MinLength(6) @MaxLength(72) password!: string;
}
export class LoginAuthDto {
  @IsString() @IsNotEmpty() @MaxLength(254) EmailorLogin!: string;
  @IsString() @IsNotEmpty() @MaxLength(72) password!: string;
}
export class UpdateAuthDto {
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(64) username?: string;
}
