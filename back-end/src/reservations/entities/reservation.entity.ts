import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Reservation {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  clientId: string;

  @Column()
  artisanId: string;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column()
  serviceType: string;

  @Column()
  notes: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
