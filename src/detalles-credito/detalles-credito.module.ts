import { Module } from '@nestjs/common';

import { DetallesCreditoController } from './detalles-credito.controller';
import { DetallesCreditoService } from './detalles-credito.service';

@Module({
  controllers: [DetallesCreditoController],
  providers: [DetallesCreditoService],
  exports: [DetallesCreditoService],
})
export class DetallesCreditoModule {}