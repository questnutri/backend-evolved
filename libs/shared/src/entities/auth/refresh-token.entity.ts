import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User

    @Column()
    token: string

    @Column()
    expiresAt: Date
}