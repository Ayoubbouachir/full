import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get('FindAll')
  findAll(@Query('userEmail') userEmail?: string) {
    return this.ordersService.findAll(userEmail);
  }

  @Get('Find/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch('Update/:id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/accept')
  acceptOrder(
    @Param('id') id: string,
    @Body('driverId') driverId: string,
    @Body('driverName') driverName?: string,
  ) {
    return this.ordersService.acceptOrder(id, driverId, driverName);
  }

  @Patch(':id/complete')
  completeOrder(@Param('id') id: string) {
    return this.ordersService.update(id, { status: 'delivered' });
  }

  @Get('factures/user/:userId')
  findFacturesByUser(@Param('userId') userId: string) {
    return this.ordersService.findFacturesByUser(userId);
  }

  @Get('factures/order/:orderId')
  findFactureByOrder(@Param('orderId') orderId: string) {
    return this.ordersService.findFactureByOrder(orderId);
  }

  @Delete('Delete/:id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
