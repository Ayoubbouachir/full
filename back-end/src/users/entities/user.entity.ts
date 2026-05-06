import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';
import { UserRole } from './user-role.enum';

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ nullable: true })
  numTele: string;

  @Column()
  address: string;

  @Column()
  cin: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  // Artisan fields
  @Column({ nullable: true })
  cv: string;

  @Column({ nullable: true })
  speciality: string;

  @Column({ nullable: true })
  position: string;

  // Supplier fields
  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  companyType: string;

  // Delivery fields
  @Column({ nullable: true })
  carPlate: string;

  // Engineer fields
  @Column({ nullable: true })
  deplome: string;

  // Marketplace: profession (plumber, electrician, mason, etc.)
  @Column({ nullable: true })
  profession: string;

  // Marketplace: average rating 0-5
  @Column({ type: 'number', nullable: true })
  rating: number;

  // Marketplace: city/region for matching
  @Column({ nullable: true })
  location: string;

  // Face recognition field
  @Column({ nullable: true, type: 'array' })
  faceDescriptor: number[];

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  // Subscription fields
  @Column({ nullable: true, default: 'FREE' })
  subscriptionPlan: string;

  @Column({ nullable: true, default: 'ACTIVE' })
  subscriptionStatus: string;

  @Column({ nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: () => 'new Date()' })
  createdAt: Date;
}
