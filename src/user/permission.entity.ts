import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  resource: string; // e.g., 'expense', 'user', 'report'

  @Column()
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];
}