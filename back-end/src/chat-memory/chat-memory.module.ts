import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatMemoryService } from './chat-memory.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage])],
  providers: [ChatMemoryService],
  exports: [ChatMemoryService],
})
export class ChatMemoryModule {}
