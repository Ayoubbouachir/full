import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';

/**
 * Public API aliases (POST /chat, /ingest, /generate-quote) required by the RAG spec,
 * while keeping /ai-assistant/* routes for existing clients.
 */
@Controller()
export class RagApiController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  async chat(
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

  @Post('ingest')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 30 * 1024 * 1024 },
    }),
  )
  async ingest(@UploadedFile() file: Express.Multer.File) {
    return this.aiAssistantService.forwardIngestToMl(file);
  }

  @Post('generate-quote')
  async generateQuote(@Body() body: any, @Res() res: Response) {
    try {
      const pdfBuffer = await this.aiAssistantService.generateQuotePDF(body);
      res.setHeader('Content-Type', 'application/pdf');
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Erreur génération PDF' });
    }
  }
}
