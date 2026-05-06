import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Subscription } from './entities/subscription.entity';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    durationMonths: 12,
    features: ['3 projets max', 'Support standard'],
  },
  {
    id: 'pro',
    name: 'Artisan Pro',
    price: 49,
    durationMonths: 1,
    features: [
      'Projets illimités',
      'Génération Devis Expert',
      'Support prioritaire',
    ],
  },
  {
    id: 'premium',
    name: 'Entreprise',
    price: 149,
    durationMonths: 1,
    features: [
      'Tout Pro',
      'Analytics avancées',
      'Rapports Excel personnalisés',
    ],
  },
];

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getPlans() {
    return SUBSCRIPTION_PLANS;
  }

  async getUserSubscription(userId: string) {
    return this.subscriptionRepository.findOneBy({ userId } as any);
  }

  async createSubscription(userId: string, planId: string, paymentId?: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error('Plan non trouvé');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const sub = this.subscriptionRepository.create({
      userId,
      planId,
      startDate,
      endDate,
      status: 'active',
      paymentId,
    });

    return this.subscriptionRepository.save(sub);
  }
}
