import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateCreditoDto } from './dto/create-credito.dto';
import { UpdateCreditoDto } from './dto/update-credito.dto';
import { CreditosService } from './creditos.service';

@Controller('creditos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditosController {
  constructor(private readonly creditosService: CreditosService) {}

  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(
    @Body() createCreditoDto: CreateCreditoDto,
    @Req() req: any,
  ) {
    return this.creditosService.create(
      createCreditoDto,
      req.user.id,
    );
  }

  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findAll() {
    return this.creditosService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR', 'CONSULTOR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.creditosService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'VENDEDOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCreditoDto: UpdateCreditoDto,
  ) {
    return this.creditosService.update(id, updateCreditoDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.creditosService.remove(id);
  }
}