import { ACEPT_USER } from 'src/user/reguests.model';
import { ObjectID } from 'typeorm';

export class SearchUserDto {
  email?: string;
  username?: string;
  limit?: number;
}

export class RequestFriendsDto {
  sender: ObjectID;
  taker: ObjectID;
  accept: ACEPT_USER;
}
