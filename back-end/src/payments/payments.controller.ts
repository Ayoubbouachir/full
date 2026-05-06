import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(@Body('items') items: any[]) {
    return this.paymentsService.createCheckoutSession(items);
  }

  @Post('request-confirmation')
  async requestConfirmation(
    @Body('items') items: any[],
    @Body('userEmail') userEmail: string,
    @Body('userName') userName: string,
  ) {
    return this.paymentsService.sendPaymentConfirmationEmail(
      items,
      userEmail,
      userName,
    );
  }

  @Get('confirm')
  async confirm(@Query('token') token: string, @Res() res: Response) {
    const stripeUrl = await this.paymentsService.confirmPayment(token);
    if (!stripeUrl) {
      throw new BadRequestException('Could not generate payment URL');
    }
    return res.redirect(stripeUrl);
  }

  @Post('send-invoice')
  async sendInvoice(
    @Body('items') items: any[],
    @Body('userEmail') userEmail: string,
    @Body('userName') userName: string,
    @Body('status') status?: string,
  ) {
    return this.paymentsService.sendInvoiceEmail(
      items,
      userEmail,
      userName,
      status,
    );
  }
}
