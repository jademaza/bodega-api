import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  NotEquals,
} from 'class-validator';

export class CreateMovimientoInventarioDto {
  @IsInt({ message: 'El productId debe ser un número entero' })
  productId!: number;

  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'], {
    message: 'El tipo debe ser IN, OUT o ADJUSTMENT',
  })
  type!: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @NotEquals(0, { message: 'La cantidad no puede ser cero' })
  quantity!: number;

  @IsString({ message: 'El motivo debe ser un texto' })
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @MaxLength(200, { message: 'El motivo no puede superar los 200 caracteres' })
  reason!: string;

  @IsInt({ message: 'El referenceId debe ser un número entero' })
  @IsOptional()
  referenceId?: number;
}