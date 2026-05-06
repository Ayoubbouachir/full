import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NegotiationMessage } from './entities/negotiation-message.entity';
import { NegotiationController } from './negotiation.controller';
import { NegotiationService } from './negotiation.service';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OffersModule } from '../offers/offers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NegotiationMessage]),
    ServiceRequestsModule,
    NotificationsModule,
    OffersModule,
  ],
  controllers: [NegotiationController],
  providers: [NegotiationService],
  exports: [NegotiationService],
})
export class NegotiationModule {}
