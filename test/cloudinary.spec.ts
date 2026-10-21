import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { v2 } from 'cloudinary';
import type { UploadApiOptions, UploadResponseCallback } from 'cloudinary';
import { Writable } from 'node:stream';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

describe('Cloudinary upload boundaries and resource ownership', () => {
  let service: CloudinaryService;
  const uploads = {
    create: jest.fn(),
    exists: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  const messages = { exists: jest.fn() },
    users = { exists: jest.fn() };
  const owner = '507f1f77bcf86cd799439011';
  const url = 'https://res.cloudinary.com/test/image/upload/file/test.png';
  function image() {
    const buffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return {
      buffer,
      mimetype: 'image/png',
      size: buffer.length,
    } as Express.Multer.File;
  }
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: { getOrThrow: () => 'test' } },
        { provide: getModelToken('Upload'), useValue: uploads },
        { provide: getModelToken('Chat'), useValue: messages },
        { provide: getModelToken('User'), useValue: users },
      ],
    }).compile();
    service = module.get(CloudinaryService);
  });
  it('rejects missing, oversized, and spoofed files before contacting Cloudinary', async () => {
    await expect(
      service.upload(undefined, 'file', owner),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.upload({ ...image(), size: 6 * 1024 * 1024 }, 'file', owner),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.upload(
        { ...image(), buffer: Buffer.from('not an image') },
        'avatars',
        owner,
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.upload(image(), 'recordMessage', owner),
    ).rejects.toMatchObject({ status: 400 });
  });
  it('persists Cloudinary public ID, resource type and owner', async () => {
    jest
      .spyOn(v2.uploader, 'upload_stream')
      .mockImplementation(
        (
          options?: UploadApiOptions | UploadResponseCallback,
          callback?: UploadResponseCallback,
        ) => {
          const done = typeof options === 'function' ? options : callback;
          const stream = new Writable({
            write(_chunk, _encoding, done) {
              done();
            },
          });
          stream.on('finish', () =>
            done?.(undefined, {
              secure_url: url,
              public_id: 'file/test',
              resource_type: 'image',
            } as never),
          );
          return stream as ReturnType<typeof v2.uploader.upload_stream>;
        },
      );
    expect(await service.upload(image(), 'file', owner)).toBe(url);
    expect(uploads.create).toHaveBeenCalledWith({
      owner,
      url,
      publicId: 'file/test',
      resourceType: 'image',
      folder: 'file',
    });
  });
  it('converts Cloudinary failures to a safe gateway error', async () => {
    jest.spyOn(v2.uploader, 'upload_stream').mockImplementation(() => {
      throw new Error('private provider detail');
    });
    await expect(service.upload(image(), 'file', owner)).rejects.toMatchObject({
      status: 502,
      message: 'Cloudinary: загрузка не выполнена',
    });
  });
  it('rejects foreign resources and protects files already attached to messages', async () => {
    uploads.exists.mockResolvedValue(null);
    await expect(service.assertOwned([url], owner)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      service.assertOwned([url], owner, [url]),
    ).resolves.toBeUndefined();
    uploads.findOne.mockResolvedValue({
      url,
      publicId: 'file/test',
      resourceType: 'image',
    });
    messages.exists.mockResolvedValue({ _id: 'message' });
    await expect(service.removeFile('test.png', owner)).rejects.toMatchObject({
      status: 409,
    });
  });
  it('deletes audio using its video resource type and retains metadata on failure', async () => {
    uploads.findOne.mockResolvedValue({
      _id: 'upload',
      url,
      publicId: 'recordMessage/test',
      resourceType: 'video',
    });
    const destroy = jest
      .spyOn(v2.uploader, 'destroy')
      .mockResolvedValue({ result: 'ok' });
    await service.removeOwned(url, owner);
    expect(destroy).toHaveBeenCalledWith('recordMessage/test', {
      resource_type: 'video',
    });
    expect(uploads.deleteOne).toHaveBeenCalledWith({ _id: 'upload' });
    uploads.deleteOne.mockClear();
    destroy.mockRejectedValue(new Error('network failure'));
    await expect(service.removeOwned(url, owner)).rejects.toMatchObject({
      status: 502,
    });
    expect(uploads.deleteOne).not.toHaveBeenCalled();
  });
});
