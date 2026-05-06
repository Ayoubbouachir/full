import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatMemoryService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async createSession(
    userId: string,
    projectId?: string | null,
    contextSummary?: string | null,
  ): Promise<ChatSession> {
    const now = new Date();
    const session = this.sessionRepo.create({
      userId,
      projectId: projectId ?? null,
      contextSummary: contextSummary ?? null,
      createdAt: now,
      updatedAt: now,
    } as Partial<ChatSession>);
    return this.sessionRepo.save(session);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    if (!ObjectId.isValid(sessionId)) return null;
    return this.sessionRepo.findOne({
      where: { _id: new ObjectId(sessionId) } as any,
    });
  }

  async getOrCreateSession(
    sessionId: string | undefined,
    userId: string,
    projectId?: string | null,
    contextSummary?: string | null,
  ): Promise<{ session: ChatSession; isNew: boolean }> {
    if (sessionId) {
      const existing = await this.getSession(sessionId);
      if (existing) {
        if (contextSummary != null || projectId != null) {
          existing.contextSummary = contextSummary ?? existing.contextSummary;
          (existing as any).projectId =
            projectId ?? (existing as any).projectId;
          (existing as any).updatedAt = new Date();
          await this.sessionRepo.save(existing);
        }
        return { session: existing, isNew: false };
      }
    }
    const session = await this.createSession(userId, projectId, contextSummary);
    return { session, isNew: true };
  }

  async findSessionsByUser(userId: string, limit = 20): Promise<ChatSession[]> {
    const list = await this.sessionRepo.find({
      where: { userId } as any,
      order: { updatedAt: 'DESC' } as any,
      take: limit,
    });
    return list;
  }

  async updateSessionContext(
    sessionId: string,
    contextSummary: string | null,
    projectId?: string | null,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      (session as any).contextSummary = contextSummary;
      if (projectId != null) (session as any).projectId = projectId;
      (session as any).updatedAt = new Date();
      await this.sessionRepo.save(session);
    }
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<ChatMessage> {
    const msg = this.messageRepo.create({
      sessionId,
      role,
      content,
      timestamp: new Date(),
    } as Partial<ChatMessage>);
    return this.messageRepo.save(msg);
  }

  async getMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    return this.messageRepo.find({
      where: { sessionId } as any,
      order: { timestamp: 'ASC' } as any,
      take: limit,
    });
  }

  async getHistoryForLLM(
    sessionId: string,
    maxMessages = 50,
  ): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    const messages = await this.getMessages(sessionId, maxMessages);
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }
}
