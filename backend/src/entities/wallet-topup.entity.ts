import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum WalletTopupStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('wallet_topups')
export class WalletTopup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 50 })
  provider!: string; // vnpay

  @Column({ name: 'txn_ref', type: 'varchar', length: 64, unique: true })
  txnRef!: string;

  @Column({
    type: 'enum',
    enum: WalletTopupStatus,
    default: WalletTopupStatus.PENDING,
  })
  status!: WalletTopupStatus;

  @Column({ name: 'provider_transaction_no', type: 'varchar', nullable: true })
  providerTransactionNo!: string | null;

  @Column({ name: 'provider_response_code', type: 'varchar', nullable: true })
  providerResponseCode!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

