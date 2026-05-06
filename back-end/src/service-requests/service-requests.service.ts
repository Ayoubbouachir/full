import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import {
  ServiceRequest,
  RequestStatus,
} from './entities/service-request.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { MatchingService } from './matching.service';
import { UserRole } from '../users/entities/user-role.enum';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private requestsRepository: Repository<ServiceRequest>,
    private matchingService: MatchingService,
  ) {}

  async create(
    engineerId: string,
    dto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const request = this.requestsRepository.create({
      ...dto,
      engineerId,
      status: 'open',
    });
    const saved = await this.requestsRepository.save(request);
    await this.matchingService.createNotificationsForNewRequest(saved);
    return saved;
  }

  async findOne(id: string): Promise<ServiceRequest> {
    const request = await this.requestsRepository.findOne({
      where: { _id: new ObjectId(id) } as any,
    });
    if (!request) throw new NotFoundException('Demande introuvable');
    return request;
  }

  async findByEngineer(engineerId: string): Promise<ServiceRequest[]> {
    return this.requestsRepository.find({
      where: { engineerId },
      order: { createdAt: 'DESC' as any },
    });
  }

  /**
   * For artisans: list requests that match their profession (open or in_negotiation).
   */
  async findAvailableForArtisan(
    artisanId: string,
    profession: string,
  ): Promise<ServiceRequest[]> {
    const requests = await this.requestsRepository.find({
      where: { status: 'open' as RequestStatus },
      order: { createdAt: 'DESC' as any },
    });
    const professionNorm = (profession || '').toLowerCase();
    return requests.filter(
      (r) =>
        (r.requiredProfession || '').toLowerCase().includes(professionNorm) ||
        professionNorm.includes((r.requiredProfession || '').toLowerCase()),
    );
  }

  async updateStatus(
    requestId: string,
    status: RequestStatus,
    userId: string,
    userRole: string,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(requestId);
    if (userRole !== UserRole.ENGINEER || request.engineerId !== userId) {
      throw new ForbiddenException(
        "Seul l'ingénieur auteur peut modifier le statut",
      );
    }
    (request as any).status = status;
    return this.requestsRepository.save(request);
  }
}
