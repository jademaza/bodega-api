import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DrizzleModule } from './drizzle/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { ProductosModule } from './productos/productos.module';
import { MovimientosInventarioModule } from './movimientos-inventario/movimientos-inventario.module';
import { CreditosModule } from './creditos/creditos.module';
import { DetallesCreditoModule } from './detalles-credito/detalles-credito.module';
import { PagosModule } from './pagos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    DrizzleModule,
    AuthModule,
    RolesModule,
    UsuariosModule,
    ClientesModule,
    ProductosModule,
    MovimientosInventarioModule,
    CreditosModule,
    DetallesCreditoModule,
    PagosModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}