import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductoDto {
  @IsString({
    message: 'El nombre debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MinLength(2, {
    message: 'El nombre debe tener al menos 2 caracteres',
  })
  @MaxLength(120, {
    message: 'El nombre no puede superar los 120 caracteres',
  })
  name!: string;

  @IsString({
    message: 'La descripción debe ser un texto',
  })
  @IsOptional()
  @MaxLength(255, {
    message: 'La descripción no puede superar los 255 caracteres',
  })
  description?: string;

  @IsString({
    message: 'La categoría debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La categoría es obligatoria',
  })
  @MaxLength(80, {
    message: 'La categoría no puede superar los 80 caracteres',
  })
  category!: string;

  @IsNumber(
    {},
    {
      message: 'El precio debe ser un número',
    },
  )
  @Min(0.01, {
    message: 'El precio debe ser mayor que 0',
  })
  price!: number;

  @IsInt({
    message: 'El stock debe ser un número entero',
  })
  @Min(0, {
    message: 'El stock no puede ser negativo',
  })
  stock!: number;

  @IsString({
    message: 'La unidad debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La unidad es obligatoria',
  })
  @MaxLength(30, {
    message: 'La unidad no puede superar los 30 caracteres',
  })
  unit!: string;

  @IsString({
    message: 'El código de barras debe ser un texto',
  })
  @IsOptional()
  @MaxLength(50, {
    message: 'El código de barras no puede superar los 50 caracteres',
  })
  barcode?: string;
}