import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { QuotationsService } from './quotations.service';
import { QuotationStatus } from './entities/quotation.entity';
import { AiService } from './ai.service';

@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotationsService: QuotationsService,
    private readonly aiService: AiService,
  ) {}

  @Post('ai/scan')
  @UseInterceptors(FileInterceptor('image'))
  async scanImage(@UploadedFile() file: Express.Multer.File) {
    try {
      return await this.aiService.scanQuotationImage(file);
    } catch (error) {
      console.error('OCR Error:', error);
      throw new InternalServerErrorException(
        `AI Scan failed: ${error.message}`,
      );
    }
  }

  @Post()
  create(@Body() createQuotationDto: any) {
    return this.quotationsService.create(createQuotationDto);
  }

  @Get('worker/:workerId')
  findAllByWorker(@Param('workerId') workerId: string) {
    return this.quotationsService.findAllByWorker(workerId);
  }

  @Get('client/:clientId')
  findAllByClient(@Param('clientId') clientId: string) {
    return this.notificationsByClient(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: QuotationStatus,
  ) {
    return this.quotationsService.updateStatus(id, status);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuotationDto: any) {
    return this.quotationsService.update(id, updateQuotationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }

  @Get(':id/download')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const quotation = await this.quotationsService.findOne(id);
    if (!quotation) {
      return res.status(404).send('Quotation not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Quotation_${id}.pdf`,
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    await this.quotationsService.generatePdf(quotation, res);
  }

  // Helper used for back compat
  notificationsByClient(clientId: string) {
    return this.quotationsService.findAllByClient(clientId);
  }
}
