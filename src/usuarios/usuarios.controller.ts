import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsuariosService } from './usuarios.service';

import { CreateUsuarioDto } from './dto/create-usuario.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post('setup-admin')
  createInitialAdmin(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    return this.usuariosService.createInitialAdmin(
      createUsuarioDto,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  create(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    return this.usuariosService.create(
      createUsuarioDto,
    );
  }

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'ADMIN',
    'VENDEDOR',
    'CONSULTOR',
  )
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'ADMIN',
    'VENDEDOR',
    'CONSULTOR',
  )
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usuariosService.findOne(id);
  }
}