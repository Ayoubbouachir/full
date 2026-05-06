import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class NegotiationMessage {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  requestId: string;

  @Column()
  senderId: string;

  @Column()
  content: string;

  @CreateDateColumn()
  timestamp: Date;
}
