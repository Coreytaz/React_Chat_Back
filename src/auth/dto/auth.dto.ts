import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateAuthDto {
  @ValidateIf((_, v) => {
    return v !== undefined;
  })
  @IsEmail(
    {},
    {
      message: 'Не правильный E-mail',
    },
  )
  @IsNotEmpty({
    message: 'E-mail не должен быть пустым!',
  })
  email: string;

  @ValidateIf((_, v) => {
    return v !== undefined;
  })
  @IsNotEmpty({
    message: 'Логин не должен быть пустым!',
  })
  @MinLength(3, {
    message: 'Логин должен содержать не менее 3 символов!',
  })
  login: string;

  @IsNotEmpty({
    message: 'Пароль не должен быть пустым!',
  })
  @MinLength(6, {
    message: 'Пароль должен содержать не менее 6 символов!',
  })
  @IsString()
  password: string;
}

export class LoginAuthDto {
  @IsNotEmpty({ message: 'E-mail или Логин не должен быть пустым' })
  @IsString()
  EmailorLogin: string;

  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @IsString()
  password: string;
}

export class UpdateAuthDto {
  @IsEmail(
    {},
    {
      message: 'Не правильный E-mail',
    },
  )
  @IsNotEmpty()
  email?: string;

  @MinLength(3, {
    message: 'Имя пользователя должно содержать не менее 3 символов!',
  })
  @IsNotEmpty()
  @IsString()
  username?: string;
}
