import { Module, forwardRef } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { ChatbotArtisanService } from './chatbot-artisan.service';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { ProjectsModule } from '../projects/projects.module';
import { OrdersModule } from '../orders/orders.module';
import { ChatMemoryModule } from '../chat-memory/chat-memory.module';
import { ClusteringModule } from '../clustering/clustering.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    forwardRef(() => ProjectsModule),
    OrdersModule,
    ChatMemoryModule,
    forwardRef(() => ClusteringModule),
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, ChatbotArtisanService],
  exports: [AiAssistantService, ChatbotArtisanService],
})
export class AiAssistantModule {}
