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
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagosService } from './pagos.service';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post(':creditId')
  @Roles('ADMIN', 'VENDEDOR')
  create(
    @Param('creditId', ParseIntPipe) creditId: number,
    @Body() dto: CreatePagoDto,
    @Req() req: any,
  ) {
    return this.pagosService.create(
      creditId,
      dto,
      req.user.id,
    );
  }

  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findAll() {
    return this.pagosService.findAll();
  }

  @Get('credito/:creditId')
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findByCredit(
    @Param('creditId', ParseIntPipe) creditId: number,
  ) {
    return this.pagosService.findByCredit(creditId);
  }
}