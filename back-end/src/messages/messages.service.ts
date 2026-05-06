import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: MongoRepository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: MongoRepository<User>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = this.messagesRepository.create(createMessageDto);
    return await this.messagesRepository.save(message);
  }

  async findChatHistory(user1: string, user2: string): Promise<Message[]> {
    return await this.messagesRepository.find({
      where: {
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
      order: { createdAt: 'ASC' },
    });
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get all messages where user is sender or receiver
    const messages = await this.messagesRepository.find({
      where: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
      order: { createdAt: 'DESC' },
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const message of messages) {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;

      if (!conversationsMap.has(otherUserId)) {
        // Fetch user details - Wrap in ObjectId for MongoDB lookup
        try {
          const user = await this.usersRepository.findOne({
            where: { _id: new ObjectId(otherUserId) } as any,
          });

          if (user) {
            conversationsMap.set(otherUserId, {
              userId: otherUserId,
              userName: `${user.prenom} ${user.nom}`,
              userEmail: user.email,
              userRole: user.role,
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
            });
          }
        } catch (e) {
          console.error(`Error fetching user ${otherUserId}:`, e);
        }
      }
    }

    return Array.from(conversationsMap.values());
  }
}
