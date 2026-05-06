import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Line } from './line.entity';

@Entity()
export class Panier {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  somme: number;

  @Column('json')
  lines: Line[];
}
