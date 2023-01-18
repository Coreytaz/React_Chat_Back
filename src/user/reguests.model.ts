import { UserModel } from 'src/user/user.model';
import { BaseEntity, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn, OneToOne, UpdateDateColumn } from 'typeorm';

export enum ACEPT_USER {
  unconfirmed = 0,
  confirmed = 1,
}

@Entity()
export class ReguestsModel extends BaseEntity {
  @ObjectIdColumn()
  _id:ObjectID;

  @OneToOne(() => UserModel, user => user._id)
  sender:ObjectID;

  @OneToOne(() => UserModel, user => user._id)
  taker:ObjectID;

  @Column({ type: Number, enum: ACEPT_USER, default: [ACEPT_USER.unconfirmed] })
  accept: ACEPT_USER;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
