import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePagoDto {
  @IsNumber({}, { message: 'El monto recibido debe ser un número' })
  @Min(0.01, { message: 'El monto recibido debe ser mayor que cero' })
  amountReceived!: number;

  @IsEnum(['CASH', 'YAPE', 'PLIN', 'CARD'], {
    message: 'El método debe ser CASH, YAPE, PLIN o CARD',
  })
  paymentMethod!: 'CASH' | 'YAPE' | 'PLIN' | 'CARD';

  @IsString({ message: 'Las notas deben ser un texto' })
  @IsOptional()
  @MaxLength(255, { message: 'Las notas no pueden superar 255 caracteres' })
  notes?: string;
}