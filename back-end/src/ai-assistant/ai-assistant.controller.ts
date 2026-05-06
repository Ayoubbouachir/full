import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Res,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AiAssistantService } from './ai-assistant.service';
import { ClusteringService } from '../clustering/clustering.service';
import { ClusterProjectsDto } from './dto/cluster-projects.dto';
import { RecommendMaterialsBmpDto } from './dto/recommend-materials-bmp.dto';
import type { Response } from 'express';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(
    private readonly aiAssistantService: AiAssistantService,
    private readonly clusteringService: ClusteringService,
  ) {}

  // --- 🛠️ CHATBOT 1 : RECHERCHE D'ARTISANS (Flottant - Salim) ---
  @Post('chat/artisan')
  async chatArtisan(@Body() body: { message: string }) {
    return this.aiAssistantService.getArtisanChatResponse(body.message);
  }

  // --- 🤖 CHATBOT 2 : ASSISTANT PROJET (Page - Maram/Salim) ---
  @Post('chat/assistant')
  async chatAssistant(
    @Body()
    body: {
      message: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
      sessionId?: string;
      userId?: string;
      projectId?: string;
    },
  ) {
    return this.aiAssistantService.getAssistantChatWithMemory(
      body.message,
      body.sessionId,
      body.history || [],
      body.userId,
    );
  }

  // 🔄 Route de secours (Alias)
  @Post('chat')
  async chatFallback(@Body() body: any) {
    return this.chatAssistant(body);
  }

  /** PDF/TXT → FAISS (proxied vers le service ML). */
  @Post('ingest')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 30 * 1024 * 1024 },
    }),
  )
  async ingestAssistant(@UploadedFile() file: Express.Multer.File) {
    return this.aiAssistantService.forwardIngestToMl(file);
  }

  // ======================================================
  // 🏗️ OUTILS DE PROJET AVANCÉS (Maram)
  // ======================================================

  @Post('recommend-materials')
  async recommendMaterials(@Body() body: { projectDescription: string }) {
    return this.aiAssistantService.recommendMaterials(body.projectDescription);
  }

  @Post('compare-quotes')
  async compareQuotes(@Body() body: { quotes: any[] }) {
    return this.aiAssistantService.compareQuotes(body.quotes);
  }

  @Post('smart-schedule')
  async smartSchedule(@Body() body: any) {
    return this.aiAssistantService.getSmartSchedule(body);
  }

  @Post('suggest-category')
  async suggestCategory(
    @Body() body: { productName: string; description?: string },
  ) {
    return this.aiAssistantService.suggestCategory(
      body.productName,
      body.description,
    );
  }

  @Post('cluster-projects')
  async clusterProjects(@Body() body: { k?: number; maxK?: number }) {
    try {
      // Tenter le clustering avancé (ML/Python) si disponible
      return await this.clusteringService.runClustering({
        k: body.k,
        maxK: body.maxK,
      });
    } catch {
      // Fallback sur le clustering simple (JS) en cas d'erreur de connexion au serveur ML
      return this.aiAssistantService.clusterProjects(body.k);
    }
  }

  @Post('clear')
  async clearRag() {
    return this.aiAssistantService.clearRag();
  }

  @Post('recommend-materials-bmp')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async recommendMaterialsBmp(@Body() body: RecommendMaterialsBmpDto) {
    return this.aiAssistantService.recommendMaterialsScheduleAware(body);
  }

  @Get('predict-price/:productName')
  async predictPrice(@Param('productName') productName: string) {
    return this.aiAssistantService.predictPriceTrends(productName);
  }

  @Post('generate-quote')
  async generateQuote(@Body() body: any, @Res() res: Response) {
    try {
      const pdfBuffer = await this.aiAssistantService.generateQuotePDF(body);
      res.setHeader('Content-Type', 'application/pdf');
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Erreur génération PDF' });
    }
  }

  @Get('report')
  async getReport(@Res() res: Response) {
    try {
      const buffer = await this.aiAssistantService.generateReportPdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Erreur rapport' });
    }
  }

  @Post('analyze-plan')
  @UseInterceptors(FileInterceptor('plan'))
  async analyzePlan(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    try {
      return await this.aiAssistantService.analyzePlanVision(file);
    } catch (e) {
      return { error: e.message || "Erreur lors de l'analyse" };
    }
  }

  @Post('analyze-progress')
  @UseInterceptors(FileInterceptor('photo'))
  async analyzeProgress(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    // Logique de simulation d'analyse de progression du chantier pour éviter l'erreur 404
    return {
      analysis_id: `PROG-${Date.now()}`,
      confidence: 88,
      detected_phase_id: 'masonry',
      detected_phase_name: 'Maçonnerie',
      progress_pct: 60,
      planned_progress: 55,
      is_on_schedule: true,
      delay_days: 0,
      days_elapsed: 75,
      next_phase_id: 'roofing',
      next_phase_name: 'Toiture',
    };
  }

  @Post('analyze-progress-vision')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'plan', maxCount: 1 },
      { name: 'photo', maxCount: 1 },
    ]),
  )
  async analyzeProgressVision(
    @UploadedFiles()
    files: { plan?: Express.Multer.File[]; photo?: Express.Multer.File[] },
    @Body() body: { plannedStartDate?: string },
  ) {
    const plan = files.plan?.[0];
    const photo = files.photo?.[0];
    if (!plan || !photo) {
      throw new BadRequestException(
        'Veuillez fournir à la fois le plan et la photo du chantier.',
      );
    }
    return this.aiAssistantService.analyzeProgressVision(
      plan,
      photo,
      body.plannedStartDate,
    );
  }

  @Post('scrape-products')
  async scrapeProducts(@Body() body: { query: string; category?: string }) {
    if (!body.query) throw new BadRequestException('Query required');
    return this.aiAssistantService.scrapeProductsFromWeb(body.query, [
      body.query,
      ...(body.category ? [body.category] : []),
    ]);
  }

  @Get('scrape-web')
  async scrapeWeb(@Query('query') query: string) {
    if (!query) throw new BadRequestException('Query required');
    return this.aiAssistantService.scrapeProductsFromWeb(query, [query]);
  }
}
