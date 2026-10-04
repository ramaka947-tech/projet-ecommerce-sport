import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: { buffer: Buffer }) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await this.uploadService.uploadImage(file);
    return { url };
  }

  @Post('video')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: { buffer: Buffer }) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await this.uploadService.uploadVideo(file);
    return { url };
  }

}