import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsString({
    message: 'El nombre del rol debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El nombre del rol es obligatorio',
  })
  @MaxLength(30, {
    message: 'El nombre del rol no puede superar los 30 caracteres',
  })
  @IsIn(
    ['ADMIN', 'VENDEDOR', 'CONSULTOR'],
    {
      message:
        'El rol debe ser ADMIN, VENDEDOR o CONSULTOR',
    },
  )
  name!: string;
}