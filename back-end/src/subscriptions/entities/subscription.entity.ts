import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class Subscription {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  userId: string;

  @Column()
  planId: string; // 'free' | 'pro' | 'premium'

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  status: 'active' | 'expired' | 'pending';

  @Column({ nullable: true })
  paymentId: string;
}
