import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString({
    message: 'El nombre debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MaxLength(100, {
    message: 'El nombre no puede superar los 100 caracteres',
  })
  name!: string;

  @IsEmail(
    {},
    {
      message: 'El email debe tener un formato válido',
    },
  )
  @MaxLength(150, {
    message: 'El email no puede superar los 150 caracteres',
  })
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

  @IsInt({
    message: 'El roleId debe ser un número entero',
  })
  roleId!: number;
}