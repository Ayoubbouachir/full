import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class Project {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  nom: string;

  @Column()
  dateD: Date;

  @Column()
  dateF: Date;

  @Column()
  cout: number;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  nbArtisan?: number;

  @Column({ nullable: true })
  nbWorker?: number;

  @Column({ nullable: true })
  maquettes: string[];

  @Column({ type: 'array', nullable: true })
  artisanIds?: string[];

  @Column({ type: 'json', nullable: true })
  artisanResponses?: Record<string, 'pending' | 'accepted' | 'refused'>;

  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'cancelled';

  @Column({ nullable: true })
  idUserEng: string | null;

  /** Optional: for clustering / BI (location code or city) */
  @Column({ nullable: true })
  location?: string | null;

  /** Optional: surface in m² for clustering */
  @Column({ nullable: true })
  surface?: number | null;
  /** Multi-task breakdown for construction projects */
  @Column({ type: 'json', nullable: true })
  tasks?: Array<{
    id: string;
    category: string;
    description: string;
    budget: number;
    assignedArtisanId: string | null;
    status:
      | 'pending'
      | 'accepted'
      | 'refused'
      | 'completed'
      | 'negotiating'
      | 'counter_offered';
    invitedAt?: Date;
    negotiatedPrice?: number;
    artisanProposedPrice?: number;
    aiRecommendedProducts?: Array<{
      id: string;
      nomP: string;
      prix: number;
      imagePUrl?: string;
      quantite?: number;
      description?: string;
    }>;
    artisanSelectedProducts?: string[]; // Array of product IDs
    aiAdvice?: string;
    currentPercentage?: number;
    progressUpdates?: Array<{
      date: string;
      description: string;
      images: string[];
      percentage: number;
    }>;
  }>;
}
