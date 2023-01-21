import { ACEPT_USER } from '../../user/reguests.model';
import { UserModel } from '../../user/user.model';

export class SearchUserDto {
  email?: string;
  username?: string;
  limit?: number;
}

export class RequestFriendsDto {
  sender: UserModel;
  taker: UserModel;
  accept: ACEPT_USER;
}
