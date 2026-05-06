import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { NegotiationService } from './negotiation.service';
import { CreateNegotiationMessageDto } from './dto/create-negotiation-message.dto';

@Controller('negotiation')
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Post('message')
  createMessage(
    @Body() dto: CreateNegotiationMessageDto,
    @Headers('x-user-id') userId: string,
    @Body('userId') userIdBody: string,
  ) {
    const uid = userId || userIdBody;
    if (!uid)
      throw new Error('User ID required (header x-user-id or body userId)');
    return this.negotiationService.create(uid, dto);
  }

  @Get('request/:requestId')
  getHistory(@Param('requestId') requestId: string) {
    return this.negotiationService.findByRequest(requestId);
  }
}
