import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateClienteDto {
  @IsString({
    message: 'El nombre debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MaxLength(80, {
    message: 'El nombre no puede superar los 80 caracteres',
  })
  name!: string;

  @IsString({
    message: 'El apellido debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El apellido es obligatorio',
  })
  @MaxLength(100, {
    message: 'El apellido no puede superar los 100 caracteres',
  })
  lastname!: string;

  @IsString({
    message: 'El DNI debe ser un texto',
  })
  @Matches(/^\d{8}$/, {
    message: 'El DNI debe contener exactamente 8 dígitos',
  })
  dni!: string;

  @IsString({
    message: 'El teléfono debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El teléfono es obligatorio',
  })
  @MaxLength(15, {
    message: 'El teléfono no puede superar los 15 caracteres',
  })
  phone!: string;

  @IsString({
    message: 'La dirección debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La dirección es obligatoria',
  })
  @MaxLength(200, {
    message: 'La dirección no puede superar los 200 caracteres',
  })
  address!: string;

  @IsEmail(
    {},
    {
      message: 'El email debe tener un formato válido',
    },
  )
  @IsOptional()
  email?: string;

  @IsNumber(
    {},
    {
      message: 'El límite de crédito debe ser un número',
    },
  )
  @Min(0, {
    message: 'El límite de crédito no puede ser negativo',
  })
  creditLimit!: number;
}