/* eslint-disable @typescript-eslint/no-empty-interface */
import { prop } from "@typegoose/typegoose"
import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses"

export interface UserModel extends Base {}

export class UserModel extends TimeStamps {
    @prop({unique: true})
    email: string

    @prop({unique: true})
    login: string

    @prop({default: ''})
    avatar: string

    @prop()
    username: string

    @prop()
    password: string

}