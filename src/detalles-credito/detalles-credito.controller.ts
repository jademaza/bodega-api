import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { DetallesCreditoService } from './detalles-credito.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('detalles-credito')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DetallesCreditoController {
  constructor(
    private readonly detallesCreditoService: DetallesCreditoService,
  ) {}

  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findAll() {
    return this.detallesCreditoService.findAll();
  }

  @Get('credito/:creditId')
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findByCredit(
    @Param('creditId', ParseIntPipe) creditId: number,
  ) {
    return this.detallesCreditoService.findByCredit(
      creditId,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.detallesCreditoService.remove(id);
  }
}