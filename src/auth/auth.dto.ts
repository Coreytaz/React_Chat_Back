import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator'

export class AuthDto {
    @ValidateIf((_, v) => {
        return v !== undefined
    })
    @IsEmail({}, {
        message: 'Не правильный E-mail'
    })
    @IsNotEmpty()
    email: string;

    @ValidateIf((_, v) => {
        return v !== undefined
    })
    @IsNotEmpty()
    login: string;

    @IsNotEmpty()
    @MinLength(6, {
        message: 'Пароль должен содержать не менее 6 символов!'
    })
    @IsString()
    password: string;
}