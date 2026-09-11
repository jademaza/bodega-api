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

import { Request } from 'express';

import { ProductosService } from './productos.service';

import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest
  extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('productos')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ProductosController {
  constructor(
    private readonly productosService: ProductosService,
  ) {}

  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(
    @Body() createProductoDto: CreateProductoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productosService.create(
      createProductoDto,
      request.user.id,
    );
  }

  @Get()
  @Roles(
    'ADMIN',
    'VENDEDOR',
    'CONSULTOR',
  )
  findAll() {
    return this.productosService.findAll();
  }

  @Get(':id')
  @Roles(
    'ADMIN',
    'VENDEDOR',
    'CONSULTOR',
  )
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productosService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'VENDEDOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(
      id,
      updateProductoDto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'VENDEDOR')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productosService.remove(id);
  }
}