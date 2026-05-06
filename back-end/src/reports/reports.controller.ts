import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('kpis')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getKpis(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getKpis(filters);
  }

  @Get('charts')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getCharts(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getCharts(filters);
  }

  @Get('ai-summary')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAiSummary(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getAiSummary(filters);
  }

  @Post('export/pdf')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportPdf(
    @Query() filters: ReportFiltersDto,
    @Body() payload: any,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportPdf(filters, payload);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=rapport-bi-fullstakers-${Date.now()}.pdf`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }

  @Post('export/excel')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportExcel(
    @Query() filters: ReportFiltersDto,
    @Body() payload: any,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportExcel(filters, payload);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=rapport-bi-fullstakers-${Date.now()}.xlsx`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }
}
