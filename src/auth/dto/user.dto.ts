import { ACEPT_USER } from "src/user/reguests.model";
import { UserModel } from "src/user/user.model";

export class SearchUserDto {
    email?: string;
    username?: string;
    limit?: number;
}

export class RequestFriendsDto{
    sender: UserModel;
    taker: UserModel;
    accept: ACEPT_USER;
}