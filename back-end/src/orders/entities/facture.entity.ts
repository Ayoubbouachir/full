import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Order } from './order.entity';

@Entity()
export class Facture {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  idUser1: string;

  @Column()
  idUser2: string;

  @Column()
  idOrder: string;

  @Column('json', { nullable: true })
  order?: Order;
}
