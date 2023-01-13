/* eslint-disable @typescript-eslint/no-empty-interface */
import { prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { UserModel } from 'src/user/user.model';

export interface FrinendsModel extends Base {}

export class FrinendsModel extends TimeStamps {
  @prop({ type: () => UserModel, ref: 'User', require: true })
  id1: UserModel;

  @prop({ type: () => UserModel, ref: 'User', require: true })
  id2: UserModel;
}
