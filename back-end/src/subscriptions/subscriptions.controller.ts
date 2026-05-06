import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    const sub = await this.subscriptionsService.getUserSubscription(userId);
    return sub || { planId: 'none', status: 'none' };
  }

  @Post('subscribe')
  async subscribe(
    @Body() body: { userId: string; planId: string; paymentId?: string },
  ) {
    return this.subscriptionsService.createSubscription(
      body.userId,
      body.planId,
      body.paymentId,
    );
  }

  @Post('start-guest-subscription')
  async startGuestSub(@Body() body: { planId: string; email: string }) {
    const plans = await this.subscriptionsService.getPlans();
    const plan = plans.find((p) => p.id === body.planId);
    if (!plan) throw new Error('Plan non trouvé');

    // Redirect directly to register (payment integration removed)
    return {
      paymentUrl: `/register?planId=${body.planId}&email=${body.email}`,
    };
  }
}
