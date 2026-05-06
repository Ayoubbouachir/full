import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class Invoice {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ default: 'local' })
  projectId: string;

  @Column()
  cat: string;

  @Column({ default: '' })
  desc: string;

  @Column()
  amount: number;

  @Column()
  date: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
