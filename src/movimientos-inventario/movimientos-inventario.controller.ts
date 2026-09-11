import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { MovimientosInventarioService } from './movimientos-inventario.service';

@Controller('movimientos-inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovimientosInventarioController {
  constructor(
    private readonly movimientosInventarioService: MovimientosInventarioService,
  ) {}

  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(
    @Body() createMovimientoDto: CreateMovimientoInventarioDto,
    @Req() req: any,
  ) {
    return this.movimientosInventarioService.create(
      createMovimientoDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findAll() {
    return this.movimientosInventarioService.findAll();
  }

  @Get('producto/:productId')
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.movimientosInventarioService.findByProduct(productId);
  }
}