import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class ChatSession {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  userId: string;

  @Column({ nullable: true })
  projectId: string | null;

  @Column({ nullable: true })
  contextSummary: string | null;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
