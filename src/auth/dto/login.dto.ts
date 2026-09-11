import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail(
    {},
    {
      message: 'El email debe tener un formato válido',
    },
  )
  email!: string;

  @IsString({
    message: 'La contraseña debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria',
  })
  @MinLength(6, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  })
  password!: string;
}