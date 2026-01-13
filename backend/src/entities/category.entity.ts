import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    icon: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
