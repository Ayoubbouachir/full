import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/entities/user-role.enum';
import { MatchingService } from '../service-requests/matching.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private serviceRequestsService: ServiceRequestsService,
    private notificationsService: NotificationsService,
    private matchingService: MatchingService,
  ) {}

  async create(
    artisanId: string,
    dto: CreateOfferDto,
  ): Promise<{ offer: Offer; engineerId: string }> {
    const request = await this.serviceRequestsService.findOne(dto.requestId);
    if (request.status !== 'open') {
      throw new BadRequestException("Cette demande n'accepte plus d'offres");
    }
    const artisans = await this.matchingService.findMatchingArtisans(
      request.requiredProfession,
      request.location,
    );
    const canOffer = artisans.some((a: any) => a._id.toString() === artisanId);
    if (!canOffer) {
      throw new ForbiddenException(
        'Votre profession ne correspond pas à cette demande',
      );
    }
    const offer = this.offersRepository.create({
      ...dto,
      artisanId,
      status: 'pending',
    });
    const saved = await this.offersRepository.save(offer);
    await this.serviceRequestsService.updateStatus(
      dto.requestId,
      'in_negotiation',
      request.engineerId,
      UserRole.ENGINEER,
    );
    await this.notificationsService.create({
      userId: request.engineerId,
      type: 'new_offer',
      referenceId: saved._id.toString(),
      title: 'Nouvelle offre',
      content: `Offre reçue: ${dto.proposedPrice} DT`,
    });
    return { offer: saved, engineerId: request.engineerId };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offersRepository.findOne({
      where: { _id: new ObjectId(id) } as any,
    });
    if (!offer) throw new NotFoundException('Offre introuvable');
    return offer;
  }

  async findByRequest(requestId: string): Promise<Offer[]> {
    return this.offersRepository.find({
      where: { requestId },
      order: { createdAt: 'DESC' as any },
    });
  }

  async findByArtisan(artisanId: string): Promise<Offer[]> {
    return this.offersRepository.find({
      where: { artisanId },
      order: { createdAt: 'DESC' as any },
    });
  }

  async accept(
    offerId: string,
    userId: string,
    userRole: string,
  ): Promise<Offer> {
    const offer = await this.findOne(offerId);
    const request = await this.serviceRequestsService.findOne(offer.requestId);
    if (userRole !== UserRole.ENGINEER || request.engineerId !== userId) {
      throw new ForbiddenException(
        "Seul l'ingénieur auteur peut accepter une offre",
      );
    }
    if (offer.status !== 'pending') {
      throw new BadRequestException("Cette offre n'est plus disponible");
    }
    (offer as any).status = 'accepted';
    const saved = await this.offersRepository.save(offer);
    await this.serviceRequestsService.updateStatus(
      offer.requestId,
      'closed',
      userId,
      userRole,
    );
    await this.notificationsService.create({
      userId: offer.artisanId,
      type: 'accepted',
      referenceId: offer.requestId,
      title: 'Offre acceptée',
      content: `Votre offre de ${offer.proposedPrice} DT a été acceptée`,
    });
    return saved;
  }

  async reject(
    offerId: string,
    userId: string,
    userRole: string,
  ): Promise<Offer> {
    const offer = await this.findOne(offerId);
    const request = await this.serviceRequestsService.findOne(offer.requestId);
    if (userRole !== UserRole.ENGINEER || request.engineerId !== userId) {
      throw new ForbiddenException(
        "Seul l'ingénieur auteur peut rejeter une offre",
      );
    }
    if (offer.status !== 'pending') {
      throw new BadRequestException("Cette offre n'est plus disponible");
    }
    (offer as any).status = 'rejected';
    const saved = await this.offersRepository.save(offer);
    await this.notificationsService.create({
      userId: offer.artisanId,
      type: 'rejected',
      referenceId: offer.requestId,
      title: 'Offre refusée',
      content: `Votre offre pour la demande "${request.title}" a été refusée`,
    });
    return saved;
  }
}
