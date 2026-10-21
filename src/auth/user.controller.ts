import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateAuthDto } from './dto/auth.dto';
import { SearchUserDto, UserQueryDto } from './dto/user.dto';
import type { AuthRequest } from '../common/http';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly cloud: CloudinaryService,
  ) {}
  @Post('avatar')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  async uploadAvatar(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const id = String(req.user._id);
    const url = await this.cloud.upload(file, 'avatars', id);
    try {
      return await this.users.setAvatar(id, url);
    } catch (error) {
      await this.cloud.cleanup([url], id);
      throw error;
    }
  }
  @Delete('avatar') deleteAvatar(@Req() req: AuthRequest) {
    return this.users.deleteAvatar(String(req.user._id));
  }
  @Patch('me') update(@Req() req: AuthRequest, @Body() dto: UpdateAuthDto) {
    return this.users.updateUser(String(req.user._id), dto);
  }
  @Get('search') search(@Query() dto: SearchUserDto, @Req() req: AuthRequest) {
    return this.users.search(dto, String(req.user._id));
  }
  @Get('getUser') getUser(@Query() dto: UserQueryDto) {
    return this.users.getUser(dto._id);
  }
  @Get('getReguestUser') requests(@Req() req: AuthRequest) {
    return this.users.getRequestUser(String(req.user._id));
  }
  @Get('getFriends') friends(@Req() req: AuthRequest) {
    return this.users.getFriends(String(req.user._id));
  }
}
