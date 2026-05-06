import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionPlan } from './entities/subscription-plan.enum';
import { UsersService } from './users.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.get<SubscriptionPlan>(
      'requiredPlan',
      context.getHandler(),
    );
    if (!requiredPlan) {
      return true; // No specific plan required
    }

    const request = context.switchToHttp().getRequest();
    // Assuming user ID is passed via headers or query for this demo environment
    // OR we can decode it if they pass user ID (e.g., from frontend LocalStorage)
    const userId =
      request.headers['x-user-id'] ||
      request.body.userId ||
      request.query.userId;

    if (!userId) {
      throw new ForbiddenException(
        'User authentication required to verify subscription',
      );
    }

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const planHierarchy: Record<string, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.SILVER]: 1,
      [SubscriptionPlan.GOLD]: 2,
      [SubscriptionPlan.PLATINUM]: 3,
    };

    const userTier =
      planHierarchy[user.subscriptionPlan || SubscriptionPlan.FREE];
    const requiredTier = planHierarchy[requiredPlan as any];

    if (userTier < requiredTier) {
      throw new ForbiddenException(
        `Access denied. Requires at least ${requiredPlan} subscription plan.`,
      );
    }

    return true;
  }
}
