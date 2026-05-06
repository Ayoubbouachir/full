import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from './entities/quotation.entity';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';

import { AiService } from './ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quotation]),
    NotificationsModule,
    OrdersModule,
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService, AiService],
})
export class QuotationsModule {}
