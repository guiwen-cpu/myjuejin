import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { ErrorCodes } from '@devshare/shared'

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name)

  constructor(private readonly config: ConfigService) {}

  async saveImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; mode: 'oss' | 'local' }> {
    const maxMb = Number(this.config.get<string>('MAX_FILE_SIZE_MB') ?? 5)
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException({ code: ErrorCodes.UNSUPPORTED_FILE_TYPE, message: '仅支持图片文件' })
    }
    if (file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException({ code: ErrorCodes.UPLOAD_TOO_LARGE, message: `图片不能超过 ${maxMb}MB` })
    }

    const region = this.config.get<string>('OSS_REGION')
    const bucket = this.config.get<string>('OSS_BUCKET')
    if (region && bucket) {
      const url = await this.uploadToOss(file)
      return { url, mode: 'oss' }
    }
    return { url: await this.saveLocal(file), mode: 'local' }
  }

  private async saveLocal(file: Express.Multer.File): Promise<string> {
    const dir = this.config.get<string>('UPLOAD_DIR') ?? 'uploads'
    const date = new Date()
    const sub = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    const ext = extname(file.originalname) || '.png'
    const filename = `${randomUUID()}${ext}`
    const targetDir = join(process.cwd(), dir, sub)
    await mkdir(targetDir, { recursive: true })
    await writeFile(join(targetDir, filename), file.buffer)
    const publicUrl = this.config.get<string>('PUBLIC_API_URL') ?? 'http://localhost:3000'
    return `${publicUrl}/uploads/${sub}/${filename}`
  }

  private async uploadToOss(file: Express.Multer.File): Promise<string> {
    const region = this.config.get<string>('OSS_REGION')!
    const bucket = this.config.get<string>('OSS_BUCKET')!
    const accessKeyId = this.config.get<string>('OSS_ACCESS_KEY_ID')!
    const accessKeySecret = this.config.get<string>('OSS_ACCESS_KEY_SECRET')!
    const publicUrl = this.config.get<string>('OSS_PUBLIC_URL')!

    const date = new Date()
    const key = `uploads/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}${extname(file.originalname) || '.png'}`
    const resource = `/${bucket}/${key}`
    const stringToSign = `PUT\n\n${file.mimetype}\n${date.toUTCString()}\n${resource}`
    const signature = createHmac('sha1', accessKeySecret).update(stringToSign).digest('base64')

    const endpoint =
      region === 'oss-cn-hangzhou' || region.startsWith('oss-')
        ? `https://${bucket}.${region}.aliyuncs.com/${key}`
        : `https://${bucket}.${region}.aliyuncs.com/${key}`

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `OSS ${accessKeyId}:${signature}`,
        'Content-Type': file.mimetype,
        Date: date.toUTCString(),
      },
      body: file.buffer,
    })
    if (!response.ok) {
      this.logger.error(`OSS upload failed: ${response.status} ${await response.text()}`)
      throw new BadRequestException({ code: ErrorCodes.INTERNAL_ERROR, message: 'OSS 上传失败' })
    }
    return `${publicUrl}/${key}`
  }
}
