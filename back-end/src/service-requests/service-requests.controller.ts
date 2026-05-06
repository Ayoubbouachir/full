import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateServiceRequestDto,
    @Headers('x-user-id') userId: string,
    @Body('userId') userIdBody: string,
  ) {
    const uid = userId || userIdBody;
    if (!uid)
      throw new Error('User ID required (header x-user-id or body userId)');
    return this.serviceRequestsService.create(uid, dto);
  }

  @Get('my')
  myRequests(@Headers('x-user-id') userId: string) {
    if (!userId) throw new Error('Header x-user-id required');
    return this.serviceRequestsService.findByEngineer(userId);
  }

  @Get('available')
  availableForArtisan(
    @Headers('x-user-id') userId: string,
    @Headers('x-profession') profession: string,
  ) {
    if (!userId) throw new Error('Header x-user-id required');
    return this.serviceRequestsService.findAvailableForArtisan(
      userId,
      profession || '',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceRequestsService.findOne(id);
  }
}
