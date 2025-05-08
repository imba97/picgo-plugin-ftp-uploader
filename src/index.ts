import type { IImgInfo, IPicGo } from 'picgo'
import type { IFtpLoaderUserConfig } from './config'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'basic-ftp'
import { config, getFtpConfig } from './config'
import { formatPath } from './util'

export default (ctx: IPicGo) => {
  const client = new Client()

  const upload = async (
    output: IImgInfo,
    localPath: string
  ): Promise<string> => {
    const userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')

    const configItem = await getFtpConfig(userConfig)

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

      localPath = path.join(ctx.baseDir, fname)

      if (image) {
        fs.writeFileSync(localPath, new Uint8Array(image))
      }
      else {
        throw new Error('Image buffer is undefined')
      }

      ctx.log.info('save web image to local.')
    }

    const ftpResponse = await client.uploadFrom(localPath, pathInfo.uploadPath)

    // 执行上传
    return new Promise((resolve, reject) => {
      if (isWebImage) {
        fs.unlinkSync(localPath)
        ctx.log.info('local temp image removeed.')
      }

      if (ftpResponse.code === 226) {
        resolve(pathInfo.path)
      }
      else {
        reject(new Error(ftpResponse.message))
        throw new Error(ftpResponse.message)
      }
    })
  }

  const handle = async (ctx: IPicGo) => {
    const userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }

    const configItem = await getFtpConfig(userConfig)
    const config = configItem[userConfig.site]

    await client.access({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password
    })

    const input = ctx.input
    const output = ctx.output
    let filesCount = input.length

    for (const i in input) {
      const localPath = input[i]

      await upload(output[i], localPath)
        .then((path) => {
          const imgUrl = `${
            /\/$/.test(config.url)
              ? config.url.slice(0, config.url.length)
              : config.url
          }${path}`

          delete output[i].buffer

          output[i].url = imgUrl
          output[i].imgUrl = imgUrl

          filesCount--
          if (filesCount <= 0)
            client.close()
        })
        .catch((err) => {
          ctx.log.error(`FTP ERROR: ${err.message}`)

          ctx.emit('notification', {
            title: 'FTP ERROR',
            body: err.message,
            text: ''
          })
        })
    }

    return ctx
  }

  const register = () => {
    ctx.helper.uploader.register('ftp-uploader', {
      handle,
      config,
      name: 'FTP 上传'
    })
  }

  return {
    uploader: 'ftp-uploader',
    register
  }
}
