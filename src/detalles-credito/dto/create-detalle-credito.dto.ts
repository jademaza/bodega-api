import { IsInt, IsPositive } from 'class-validator';

export class CreateDetalleCreditoDto {
  @IsInt({ message: 'El creditId debe ser un número entero' })
  creditId!: number;

  @IsInt({ message: 'El productId debe ser un número entero' })
  productId!: number;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsPositive({ message: 'La cantidad debe ser mayor que cero' })
  quantity!: number;
}