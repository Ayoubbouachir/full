import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { MarketplaceGateway } from '../marketplace/marketplace.gateway';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly marketplaceGateway: MarketplaceGateway,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateOfferDto,
    @Headers('x-user-id') userId: string,
    @Body('userId') userIdBody: string,
  ) {
    const uid = userId || userIdBody;
    if (!uid)
      throw new Error('User ID required (header x-user-id or body userId)');
    const result = await this.offersService.create(uid, dto);
    if (result.engineerId) {
      this.marketplaceGateway.emitNewOffer(result.engineerId, result.offer);
    }
    return result.offer;
  }

  @Get('request/:requestId')
  findByRequest(@Param('requestId') requestId: string) {
    return this.offersService.findByRequest(requestId);
  }

  @Get('my')
  myOffers(@Headers('x-user-id') userId: string) {
    if (!userId) throw new Error('Header x-user-id required');
    return this.offersService.findByArtisan(userId);
  }

  @Post(':id/accept')
  async accept(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    const uid = userId;
    const role = userRole;
    if (!uid) throw new Error('User ID required');
    const offer = await this.offersService.accept(id, uid, role || 'Engineer');
    this.marketplaceGateway.emitStatusChange(offer.requestId, 'closed', [
      offer.artisanId,
    ]);
    return offer;
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    const uid = userId;
    const role = userRole;
    if (!uid) throw new Error('User ID required');
    return this.offersService.reject(id, uid, role || 'Engineer');
  }
}
