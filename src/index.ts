import picgo from 'picgo'
import { IImgInfo } from 'picgo/dist/src/types'
import { config, getFtpConfig, IFtpLoaderUserConfig } from './config'
import { formatPath } from './util'
import { Client } from 'basic-ftp'

export = (ctx: picgo) => {
  const client = new Client()

  const handle = async (ctx: picgo) => {
    let userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')
    if (!userConfig) {
      throw new Error("Can't find uploader config")
    }

    const configItem = await getFtpConfig(userConfig)
    const config = configItem[userConfig.site]

    await client.access({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password
    })

    let input = ctx.input
    let output = ctx.output
    let filesCount = input.length

    for (let i in input) {
      let localPath = input[i]

      await upload(output[i], localPath)
        .then((path) => {
          let imgUrl = `${
            /\/$/.test(config.url)
              ? config.url.substr(0, config.url.length)
              : config.url
          }${path}`

          delete output[i].buffer

          output[i].url = imgUrl
          output[i].imgUrl = imgUrl

          filesCount--
          if (filesCount <= 0) client.close()
        })
        .catch((err) => {
          ctx.log.error('FTP 发生错误，请检查配置是否正确')
          ctx.emit('notification', {
            title: 'FTP 错误',
            body: err,
            text: ''
          })
        })
    }

    return ctx
  }

  const upload = async (
    output: IImgInfo,
    localPath: string
  ): Promise<string> => {
    let userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')

    const configItem = await getFtpConfig(userConfig)

    let pathInfo = formatPath(output, configItem[userConfig.site])

    // 文件夹的路径
    const dir = pathInfo.uploadPath.substr(
      0,
      pathInfo.uploadPath.lastIndexOf('/')
    )

    // 创建文件夹
    await client.ensureDir(dir)
    const ftpResponse = await client.uploadFrom(localPath, pathInfo.uploadPath)

    // 执行上传
    return new Promise((resolve, reject) => {
      if (ftpResponse.code === 226) {
        resolve(pathInfo.path)
      } else {
        reject(new Error(ftpResponse.message))
        throw new Error(ftpResponse.message)
      }
    })
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
