/* eslint-disable @typescript-eslint/no-empty-interface */
import { mongoose, prop } from "@typegoose/typegoose"
import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses"
import { ObjectId } from "mongoose";
import { UserModel } from "src/user/user.model";

export interface ChatModel extends Base {}

export class ChatModel extends TimeStamps {
    @prop({require: true})
    message: string

    @prop({type : () => mongoose.Schema.Types.ObjectId, ref: 'User', require: true})
    users: [ObjectId]

    @prop({ type: () => UserModel, ref: 'User', require: true})
    sender: UserModel[];

    @prop({default: null})
    voiceMessage?: string

    @prop({default: []})
    attachments?: [{id: string, url: string}]
}
