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

import { ClientesService } from './clientes.service';

import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

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

@Controller('clientes')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
  ) {}

  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(
    @Body() createClienteDto: CreateClienteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.clientesService.create(
      createClienteDto,
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
    return this.clientesService.findAll();
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
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'VENDEDOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(
      id,
      updateClienteDto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'VENDEDOR')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.remove(id);
  }
}