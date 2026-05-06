import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export type NotificationType =
  | 'new_request'
  | 'new_offer'
  | 'message'
  | 'accepted'
  | 'rejected'
  | 'quotation'
  | 'quotation_update'
  | 'task_invitation'
  | 'project_active'
  | 'project_accepted'
  | 'project_refused'
  | 'project_invitation'
  | 'safety_violation';

@Entity()
export class Notification {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  userId: string;

  @Column({ nullable: true })
  senderId: string;

  @Column()
  type: NotificationType;

  @Column({ type: 'string', nullable: true })
  referenceId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'string', nullable: true })
  title: string;

  @Column({ type: 'string', nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
