import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('product')
export class Product {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  nomP: string;

  @Column()
  prix: number;

  @Column()
  quantite: number;

  @Column()
  imagePUrl: string;

  @Column()
  description: string;

  @Column()
  categorie: string;

  @Column()
  supplierId: string;

  @Column({ default: [] })
  reviews: {
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: Date;
    reactions?: { userId: string; type: string }[];
  }[];
}
