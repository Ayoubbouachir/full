import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { ServiceRequest } from './entities/service-request.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ServiceRequest)
    private requestsRepository: Repository<ServiceRequest>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Find artisans whose profession matches requiredProfession.
   * Optionally filter by location proximity (same location string or contains).
   */
  async findMatchingArtisans(
    requiredProfession: string,
    requestLocation?: string,
  ): Promise<User[]> {
    const professionNorm = (requiredProfession || '').toLowerCase().trim();
    if (!professionNorm) return [];

    const artisans = await this.usersRepository.find({
      where: { role: UserRole.ARTISAN } as any,
    });

    const matched = artisans.filter((a: any) => {
      const p = (a.profession || a.speciality || '').toLowerCase().trim();
      if (!p || (!p.includes(professionNorm) && !professionNorm.includes(p)))
        return false;
      if (requestLocation && (a.location || a.address)) {
        const loc = (a.location || a.address || '').toLowerCase();
        const reqLoc = requestLocation.toLowerCase();
        if (loc && reqLoc && !loc.includes(reqLoc) && !reqLoc.includes(loc))
          return false;
      }
      return true;
    });

    return matched;
  }

  /**
   * Create notifications for all matching artisans when a new request is created.
   */
  async createNotificationsForNewRequest(
    request: ServiceRequest,
  ): Promise<void> {
    const artisans = await this.findMatchingArtisans(
      request.requiredProfession,
      request.location,
    );
    for (const artisan of artisans) {
      await this.notificationsService.create({
        userId: (artisan as any)._id.toString(),
        type: 'new_request',
        referenceId: (request as any)._id.toString(),
        title: 'Nouvelle demande',
        content: `Demande: ${request.title} (${request.requiredProfession})`,
      });
    }
  }
}
