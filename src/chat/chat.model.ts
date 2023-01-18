/* eslint-disable @typescript-eslint/no-empty-interface */
import { UserModel } from 'src/user/user.model';
import { BaseEntity, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn, OneToMany,UpdateDateColumn } from 'typeorm';

@Entity()
export class ChatModel extends BaseEntity {
  @ObjectIdColumn()
  _id:ObjectID;

  @Column()
  message: string;

  @OneToMany(() => UserModel, user => user._id)
  users: ObjectID[];

  @OneToMany(() => UserModel, user => user._id)
  sender: ObjectID[];

  @Column({ default: null })
  voiceMessage?: string;

  @Column({ default: [] })
  attachments?: [{ id: string; url: string }];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
