import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ProjectsModule } from './projects/projects.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentsModule } from './payments/payments.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { ChatMemoryModule } from './chat-memory/chat-memory.module';
import { ClusteringModule } from './clustering/clustering.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { OffersModule } from './offers/offers.module';
import { NegotiationModule } from './negotiation/negotiation.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { QuotationsModule } from './quotations/quotations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url:
          configService.get<string>('MONGO_URI') ||
          'mongodb://127.0.0.1:27017/fullstackers',
        database: 'fullstackers',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    ReservationsModule,
    MessagesModule,
    PaymentsModule,
    AiAssistantModule,
    ChatMemoryModule,
    ClusteringModule,
    ReportsModule,
    NotificationsModule,
    ServiceRequestsModule,
    OffersModule,
    NegotiationModule,
    MarketplaceModule,
    ProjectsModule,
    QuotationsModule,
    SubscriptionsModule,
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
