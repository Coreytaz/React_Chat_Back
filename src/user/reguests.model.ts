/* eslint-disable @typescript-eslint/no-empty-interface */
import { prop } from "@typegoose/typegoose"
import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses"
import { UserModel } from "src/user/user.model";

export enum ACEPT_USER {
    unconfirmed= 0,
    confirmed= 1
}


export interface ReguestsModel extends Base {}

export class ReguestsModel extends TimeStamps {
    @prop({ type: () => UserModel, ref: 'User', require: true})
    sender: UserModel;

    @prop({ type: () => UserModel, ref: 'User', require: true})
    taker: UserModel;

    @prop({ type: Number, enum: ACEPT_USER, default: [ACEPT_USER.unconfirmed] })
    accept: ACEPT_USER;
}
