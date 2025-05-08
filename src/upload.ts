import type { IPicGo } from 'picgo'
import type { IFtpLoaderUserConfig } from './config'
import type { FtpUploader } from './ftp'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { join } from 'pathe'
import { getFtpConfig } from './config'
import { formatPath } from './util'

export function useUploader(
  ctx: IPicGo,
  client: FtpUploader
) {
  const upload = async (localPath: string) => {
    const userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')

    const configItem = await getFtpConfig(userConfig)

    const { output: [output] } = ctx

    let pathInfo = formatPath(output, configItem[userConfig.site])

    // 文件夹的路径
    const dir = pathInfo.uploadPath.slice(
      0,
      pathInfo.uploadPath.lastIndexOf('/')
    )

    // 创建文件夹
    await client.ensureDir(dir).catch((err) => {
      ctx.log.error(`FTP ERROR: ${err.message}`)
    })

    // 如果是网络图片，先存到本地再使用 FTP 上传
    let isWebImage = false
    const reg = /^https?:\/\//gi

    if (reg.test(localPath)) {
      isWebImage = true

      let image = output.buffer

      if (!image && output.base64Image) {
        image = Buffer.from(output.base64Image, 'base64')
      }

      let fname = output.fileName!

      const extname = fname.match(/\.[^.]+$/g)
      if (extname) {
      // 文件名有后缀
        output.extname = extname[0]
        pathInfo = formatPath(output, configItem[userConfig.site]) // 为了避免出现jpg和gpeg后缀的问题，例如：154848x9rs296aca6eii44.jpg_1668137293.jpeg
      }
      else {
      // 无后缀
        fname = fname + output.extname
      }

      localPath = join(ctx.baseDir, fname)

      if (image) {
        fs.writeFileSync(localPath, new Uint8Array(image))
      }
      else {
        throw new Error('Image buffer is undefined')
      }

      ctx.log.info('save web image to local.')
    }

    await client.uploadFrom(localPath, pathInfo.uploadPath)

    if (isWebImage) {
      fs.unlinkSync(localPath)
      ctx.log.info('local temp image removeed.')
    }

    return pathInfo.path
  }

  return {
    upload
  }
}
