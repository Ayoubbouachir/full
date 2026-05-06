import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectId,
  CreateDateColumn,
} from 'typeorm';

export enum QuotationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('quotations')
export class Quotation {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  workerId: string;

  @Column()
  clientId: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column('json', { nullable: true })
  items: { item: string; qty: number; unitPrice: number; total: number }[];

  @Column()
  estimatedTime: string; // e.g., "3 days", "1 week"

  @Column({
    type: 'enum',
    enum: QuotationStatus,
    default: QuotationStatus.PENDING,
  })
  status: QuotationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  validUntil: Date;
}
