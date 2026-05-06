import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class ChatMessage {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  sessionId: string;

  @Column()
  role: 'user' | 'assistant';

  @Column('text')
  content: string;

  @Column()
  timestamp: Date;
}
