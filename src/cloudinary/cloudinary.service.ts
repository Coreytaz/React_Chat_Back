import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { Model } from 'mongoose';
import { Upload } from './upload.model';
import { ChatModel } from '../chat/chat.model';
import { UserModel } from '../user/user.model';
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  constructor(
    config: ConfigService,
    @InjectModel('Upload') private readonly uploads: Model<Upload>,
    @InjectModel('Chat') private readonly messages: Model<ChatModel>,
    @InjectModel('User') private readonly users: Model<UserModel>,
  ) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }
  async upload(
    file: Express.Multer.File | undefined,
    folder: 'avatars' | 'file' | 'recordMessage',
    owner: string,
  ) {
    if (!file) throw new BadRequestException('Не удалось получить файл');
    const audio = folder === 'recordMessage';
    if (file.size > (audio ? 20 : 5) * 1024 * 1024)
      throw new BadRequestException('Файл слишком большой');
    const b = file.buffer;
    const png = b
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
    const image =
      (file.mimetype === 'image/png' && png) ||
      (file.mimetype === 'image/jpeg' && jpeg);
    const mime = file.mimetype.split(';')[0];
    const audioSignature =
      (mime === 'audio/webm' &&
        b.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))) ||
      (mime === 'audio/ogg' && b.subarray(0, 4).toString() === 'OggS') ||
      (['audio/wav', 'audio/x-wav'].includes(mime) &&
        b.subarray(0, 4).toString() === 'RIFF' &&
        b.subarray(8, 12).toString() === 'WAVE') ||
      (mime === 'audio/mpeg' &&
        (b.subarray(0, 3).toString() === 'ID3' ||
          (b[0] === 255 && (b[1] & 224) === 224))) ||
      (['audio/mp4', 'audio/x-m4a'].includes(mime) &&
        b.subarray(4, 8).toString() === 'ftyp');
    if (audio ? !audioSignature : !image)
      throw new BadRequestException('Неподдерживаемый формат файла');
    let result: UploadApiResponse;
    try {
      result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: audio ? 'video' : 'image' },
          (error, data) => {
            if (error || !data) reject(new Error('Upload failed'));
            else resolve(data);
          },
        );
        stream.on('error', () => reject(new Error('Upload failed')));
        stream.end(b);
      });
    } catch {
      throw new BadGatewayException('Cloudinary: загрузка не выполнена');
    }
    try {
      await this.uploads.create({
        owner,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        folder,
      });
    } catch (error) {
      await cloudinary.uploader
        .destroy(result.public_id, { resource_type: result.resource_type })
        .catch(() => undefined);
      throw error;
    }
    return result.secure_url;
  }
  async assertOwned(
    urls: string[],
    owner: string,
    allowedExisting: string[] = [],
  ) {
    for (const url of new Set(urls)) {
      if (allowedExisting.includes(url)) continue;
      if (!(await this.uploads.exists({ url, owner })))
        throw new ForbiddenException('Файл не принадлежит пользователю');
    }
  }
  async removeFile(filename: string, owner: string) {
    if (!/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9]+)?$/.test(filename))
      throw new BadRequestException('Некорректный файл');
    const publicId = 'file/' + filename.replace(/\.[^.]+$/, '');
    const upload = await this.uploads.findOne({ publicId, owner });
    if (!upload)
      throw new ForbiddenException('Файл не принадлежит пользователю');
    if (await this.inUse(upload.url))
      throw new ConflictException('Файл используется в сообщении');
    await this.removeOwned(upload.url, owner);
  }
  private async inUse(url: string) {
    return (
      (await this.messages.exists({
        $or: [{ voiceMessage: url }, { 'attachments.url': url }],
      })) || (await this.users.exists({ avatar: url }))
    );
  }
  async removeOwned(url: string, owner: string) {
    const upload = await this.uploads.findOne({ url, owner });
    if (!upload || (await this.inUse(url))) return;
    try {
      const result = await cloudinary.uploader.destroy(upload.publicId, {
        resource_type: upload.resourceType,
      });
      if (!['ok', 'not found'].includes(String(result.result)))
        throw new Error('Delete failed');
      await this.uploads.deleteOne({ _id: upload._id });
    } catch {
      throw new BadGatewayException('Cloudinary: удаление не выполнено');
    }
  }
  async cleanup(urls: string[], owner: string) {
    for (const url of new Set(urls)) {
      try {
        await this.removeOwned(url, owner);
      } catch {
        this.logger.warn(
          'Cloud resource cleanup failed; upload metadata retained for retry',
        );
      }
    }
  }
}
