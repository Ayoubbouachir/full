import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export type RequestStatus = 'open' | 'in_negotiation' | 'closed';

@Entity()
export class ServiceRequest {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  engineerId: string;

  @Column()
  title: string;

  @Column({ type: 'string', nullable: true })
  description: string;

  @Column()
  requiredProfession: string;

  @Column({ type: 'string', nullable: true })
  location: string;

  @Column({ type: 'string', nullable: true })
  budgetRange: string;

  @Column({ default: 'open' })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;
}
