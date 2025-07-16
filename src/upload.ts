import type { IPicGo } from 'picgo'
import type { FTPLoaderUserConfigItem } from './config'
import type { FtpUploader } from './ftp'
import { Buffer } from 'node:buffer'
import { formatPath } from './util'

export function useUploader(
  ctx: IPicGo,
  client: FtpUploader,
  config: FTPLoaderUserConfigItem
) {
  // 公共逻辑
  const doUpload = async (
    fileOrBuffer: string | Buffer,
    pathInfo: any
  ) => {
    // 文件夹的路径
    const dir = pathInfo.uploadPath.slice(
      0,
      pathInfo.uploadPath.lastIndexOf('/')
    )

    // 创建文件夹
    await client.ensureDir(dir).catch((err) => {
      ctx.log.error(`FTP ERROR: ${err.message}`)
    })

    await client.uploadFrom(fileOrBuffer, pathInfo.uploadPath)
    return pathInfo.path
  }

  // 处理本地路径上传
  const upload = async (localPath: string, idx: number) => {
    const output = ctx.output[idx]
    let pathInfo = formatPath(output, config)

    const reg = /^https?:\/\//gi

    if (reg.test(localPath)) {
      // 网络图片，优先用 buffer 或 base64Image 直接上传
      let image = output.buffer

      if (!image && output.base64Image) {
        image = Buffer.from(output.base64Image, 'base64')
      }

      let fname = output.fileName!

      const extname = fname.match(/\.[^.]+$/g)
      if (extname) {
        output.extname = extname[0]
        pathInfo = formatPath(output, config)
      }
      else {
        fname = fname + output.extname
      }

      if (image) {
        ctx.log.info('upload web image buffer directly.')
        return doUpload(image, pathInfo)
      }
      else {
        throw new Error('Image buffer is undefined')
      }
    }

    // 本地文件上传
    const result = await doUpload(localPath, pathInfo)
    return result
  }

  // 处理 Buffer 上传
  const uploadBuffer = async (buffer: Buffer, idx: number) => {
    const output = ctx.output[idx]
    const pathInfo = formatPath(output, config)
    return doUpload(buffer, pathInfo)
  }

  return {
    upload,
    uploadBuffer
  }
}
