import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service';
import { UploadSchema } from './upload.model';
import { ModelsModule } from '../user/models.module';
@Module({
  imports: [
    ModelsModule,
    MongooseModule.forFeature([
      { name: 'Upload', schema: UploadSchema, collection: 'Uploads' },
    ]),
  ],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
