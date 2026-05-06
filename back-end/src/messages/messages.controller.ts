import { Controller, Get, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('history/:user1/:user2')
  async getChatHistory(
    @Param('user1') user1: string,
    @Param('user2') user2: string,
  ) {
    return this.messagesService.findChatHistory(user1, user2);
  }

  @Get('conversations/:userId')
  async getConversations(@Param('userId') userId: string) {
    return this.messagesService.getConversations(userId);
  }
}
