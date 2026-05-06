import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

const PLANS = [
  {
    id: 'silver',
    name: 'Plan Silver',
    price: 50,
    features: ['Accès aux offres basiques', 'Profil visible', 'Support limité'],
  },
  {
    id: 'gold',
    name: 'Plan Gold',
    price: 150,
    features: ['Accès prioritaire', 'Badge vérifié', 'Support dédié'],
  },
  {
    id: 'platinum',
    name: 'Plan Platinum',
    price: 250,
    features: ['Visibilité Premium', 'Sans commissions', 'Assistance 24/7 VIP'],
  },
];

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly usersService: UsersService) {}

  @Get('plans')
  getPlans() {
    return PLANS;
  }

  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) return null;
    return {
      planId: (user.subscriptionPlan || 'FREE').toLowerCase(),
      status: user.subscriptionStatus || 'PENDING',
      expiresAt: user.subscriptionExpiresAt,
    };
  }

  @Post('subscribe')
  async subscribe(@Body() body: { userId: string; planId: string }) {
    const { userId, planId } = body;
    const planIdEnumString = planId.toUpperCase();
    const updatedUser = await this.usersService.upgradeSubscription(
      userId,
      planIdEnumString,
    );
    if (!updatedUser) throw new Error('User not found');

    return {
      planId: updatedUser.subscriptionPlan.toLowerCase(),
      status: updatedUser.subscriptionStatus,
      expiresAt: updatedUser.subscriptionExpiresAt,
    };
  }

  @Post('start-guest-subscription')
  startGuestSubscription(@Body() body: { email: string; planId: string }) {
    // Generate a mock payment URL
    return {
      paymentUrl: `http://localhost:3001/checkout?plan=${body.planId}&email=${body.email}`,
    };
  }
}
