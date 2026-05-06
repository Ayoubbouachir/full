import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

@Entity()
export class Offer {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  requestId: string;

  @Column()
  artisanId: string;

  @Column({ type: 'number' })
  proposedPrice: number;

  @Column({ type: 'string', nullable: true })
  message: string;

  @Column({ default: 'pending' })
  status: OfferStatus;

  @CreateDateColumn()
  createdAt: Date;
}
