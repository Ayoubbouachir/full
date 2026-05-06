import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { MatchingService } from './matching.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, MatchingService],
  exports: [ServiceRequestsService, MatchingService],
})
export class ServiceRequestsModule {}
