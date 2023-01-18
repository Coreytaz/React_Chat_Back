import { UserModel } from 'src/user/user.model';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ObjectID, ObjectIdColumn, OneToOne, UpdateDateColumn } from 'typeorm';

@Entity()
export class FrinendsModel extends BaseEntity {
  @ObjectIdColumn()
  _id:ObjectID;

  @OneToOne(type => UserModel, (user) => user._id)
  @JoinColumn()
  id1: ObjectID;

  @OneToOne(type => UserModel, (user) => user._id)
  @JoinColumn()
  id2: ObjectID;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
