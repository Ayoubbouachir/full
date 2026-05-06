import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class Message {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  senderId: string;

  @Column()
  receiverId: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
