import { BaseEntity, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity()
@Unique(['_id', 'email', 'login'])
export class UserModel extends BaseEntity {
  @ObjectIdColumn()
  _id:ObjectID;

  @Column()
  email: string;

  @Column()
  login: string;

  @Column({nullable: true})
  avatar: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
