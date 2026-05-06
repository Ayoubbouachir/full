import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { NegotiationMessage } from './entities/negotiation-message.entity';
import { CreateNegotiationMessageDto } from './dto/create-negotiation-message.dto';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OffersService } from '../offers/offers.service';

@Injectable()
export class NegotiationService {
  constructor(
    @InjectRepository(NegotiationMessage)
    private messagesRepository: Repository<NegotiationMessage>,
    private serviceRequestsService: ServiceRequestsService,
    private notificationsService: NotificationsService,
    private offersService: OffersService,
  ) {}

  async create(
    senderId: string,
    dto: CreateNegotiationMessageDto,
  ): Promise<NegotiationMessage> {
    const request = await this.serviceRequestsService.findOne(dto.requestId);
    if (request.status === 'closed') {
      throw new ForbiddenException('La négociation est terminée');
    }
    const isEngineer = request.engineerId === senderId;
    const offers = await this.offersService.findByRequest(dto.requestId);
    const isArtisan = offers.some((o: any) => o.artisanId === senderId);
    if (!isEngineer && !isArtisan) {
      throw new ForbiddenException('Vous ne participez pas à cette demande');
    }
    const msg = this.messagesRepository.create({
      requestId: dto.requestId,
      senderId,
      content: dto.content,
    });
    const saved = await this.messagesRepository.save(msg);
    const notifyUserId = isEngineer
      ? offers.find((o: any) => o.artisanId !== senderId)?.artisanId
      : request.engineerId;
    if (notifyUserId) {
      await this.notificationsService.create({
        userId: notifyUserId,
        type: 'message',
        referenceId: dto.requestId,
        title: 'Nouveau message',
        content: dto.content.slice(0, 80),
      });
    }
    return saved;
  }

  async findByRequest(requestId: string): Promise<NegotiationMessage[]> {
    return this.messagesRepository.find({
      where: { requestId },
      order: { timestamp: 'ASC' as any },
    });
  }
}
