import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetalleCreditoDto {
  @IsInt({ message: 'El productId debe ser un número entero' })
  productId!: number;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsPositive({ message: 'La cantidad debe ser mayor que cero' })
  quantity!: number;
}

export class CreateCreditoDto {
  @IsInt({ message: 'El customerId debe ser un número entero' })
  customerId!: number;

  @IsDateString({}, { message: 'La fecha de vencimiento no es válida' })
  dueDate!: string;

  @IsString({ message: 'Las notas deben ser un texto' })
  @IsOptional()
  @MaxLength(255, { message: 'Las notas no pueden superar 255 caracteres' })
  notes?: string;

  @IsArray({ message: 'Los detalles deben ser un arreglo' })
  @IsNotEmpty({ message: 'El crédito debe tener al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCreditoDto)
  details!: CreateDetalleCreditoDto[];
}