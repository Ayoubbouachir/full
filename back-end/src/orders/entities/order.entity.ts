import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Line } from './line.entity';

@Entity()
export class Order {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  dateArrivage: Date;

  @Column()
  dateLivraison: Date;

  @Column()
  status: string;

  @Column()
  trackingNumber: string;

  @Column()
  userEmail: string;

  @Column({ nullable: true })
  driverId: string;

  @Column({ nullable: true })
  driverName: string;

  @Column({ nullable: true })
  totalPrice: number;

  @Column('json')
  lines: Line[];
}
