import picgo from 'picgo'
import ftpClient from 'ftp'
import { IImgInfo } from 'picgo/dist/src/types'

import crypto from 'crypto'

const ftp = new ftpClient()

interface IFtpLoaderUserConfig {
  url: string
  path: string
  uploadPath: string
  host: string
  port: number
  username?: string
  password?: string
}

interface IFtpLoaderPathInfo {
  path: string
  uploadPath: string
}

export = (ctx: picgo) => {

  const config = (ctx: picgo) => {
    let userConfig = ctx.getConfig<IFtpLoaderUserConfig>('picBed.ftp-uploader')
    if (!userConfig) {
      userConfig = {
        url: '',
        path: '',
        uploadPath: '/uploads/{year}/{month}',
        host: '',
        port: 21
      }
    }
    return [
      {
        name: 'url',
        type: 'input',
        default: userConfig.url,
        required: true,
        message: 'https://imba97.cn',
        alias: '域名地址'
      },
      {
        name: 'path',
        type: 'input',
        default: userConfig.path,
        required: true,
        message: '/uploads/{year}/{month}/{fullName}',
        alias: '网址路径'
      },
      {
        name: 'uploadPath',
        type: 'input',
        default: userConfig.uploadPath,
        required: true,
        message: '/blog/uploads/{year}/{month}/{fullName}',
        alias: '文件路径'
      },
      {
        name: 'host',
        type: 'input',
        default: userConfig.host,
        required: true,
        message: 'Host by ftp.',
        alias: 'FTP地址'
      },
      {
        name: 'port',
        type: 'input',
        default: userConfig.port,
        required: true,
        message: 'Port by ftp.',
        alias: '端口'
      },
      {
        name: 'username',
        type: 'input',
        default: userConfig.username,
        required: false,
        message: 'Username by ftp.',
        alias: '用户名（可选）'
      },
      {
        name: 'password',
        type: 'input',
        default: userConfig.password,
        required: false,
        message: 'Password by ftp.',
        alias: '密码（可选）'
      }
    ]
  }

  const handle = async (ctx: picgo) => {

    let userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')
    if (!userConfig) {
      throw new Error("Can't find uploader config")
    }

    ftp.on('error', async function(err) {
      ctx.log.error(err)
      ctx.emit('notification', {
        title: 'FTP 错误',
        body: `${err}`,
        text: ''
      })
    })

    ftp.connect({
      host: userConfig.host,
      port: userConfig.port,
      user: userConfig.username,
      password: userConfig.password
    })

    await ftpOnReady()

    let input = ctx.input
    let output = ctx.output
    let filesCount = input.length

    for (let i in input) {
      let localPath = input[i]

      await upload(output[i], localPath)
      .then(path => {

        let imgUrl = `${/\/$/.test(userConfig.url) ? userConfig.url.substr(0, userConfig.url.length) : userConfig.url}${path}`

        delete output[i].buffer

        output[i].url = imgUrl
        output[i].imgUrl = imgUrl

        filesCount--
        if(filesCount <= 0) ftp.end()
      })
      .catch(err => {
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
  
  const ftpOnReady = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      ftp.on('ready', () => {
        resolve('OK')
      })
    })
  }

  const upload = (output: IImgInfo, localPath: string) : Promise<string> => {

    let userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')

    let pathInfo = formatPath(output, userConfig)

    // 自动创建文件夹 然后执行上传
    return new Promise((resolve, reject) => {

      let path = pathInfo.uploadPath.substr(0, pathInfo.uploadPath.lastIndexOf('/') + 1)

      ftp.get(path, (err) => {
        // 如果没有文件夹
        if(err) {
          // 创建文件夹
          ftp.mkdir(path, true, (err) => {
            if(err) reject(err)
            resolve(doUpload(localPath, pathInfo))
          })
        } else {
          resolve(doUpload(localPath, pathInfo))
        }
      })
    })
    
  }

  const doUpload = (localPath: string, formatPath: IFtpLoaderPathInfo) : Promise<string> => {
    return new Promise(function (resolve, reject) {
      ftp.put(localPath, formatPath.uploadPath, function(err) {
        if (err) reject(err)
        resolve(formatPath.path)
      })
    })
    
  }

  const formatPath = (output: IImgInfo, userConfig: IFtpLoaderPathInfo) : IFtpLoaderPathInfo => {
    // 获取日期
    let date = new Date()

    // 格式化数据
    let formatData = {

      // 路径
      year: `${date.getFullYear()}`,
      month: date.getMonth() < 9 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`,

      // 文件名
      fullName: output.fileName,
      fileName: output.fileName.replace(output.extname, ''),
      hash16: crypto.createHash('md5').update(output.base64Image ? output.base64Image : output.buffer.toString()).digest('hex').substr(0, 16),
      hash32: crypto.createHash('md5').update(output.base64Image ? output.base64Image : output.buffer.toString()).digest('hex'),

      // 后缀名
      ext: output.extname.replace('.', ''),
    }
    // 未格式化路径
    let pathInfo: IFtpLoaderPathInfo = {
      path: userConfig.path,
      uploadPath: userConfig.uploadPath
    }
    // 替换后的路径
    let formatPath: IFtpLoaderPathInfo = {
      path: '',
      uploadPath: ''
    }

    for(let key in pathInfo) {
      // 匹配 {} 内容
      let out = 0
      let reg = /(?:{(\w+)})/g
      formatPath[key] = pathInfo[key]
      let result: RegExpExecArray
      while(result = reg.exec(pathInfo[key])) {

        // 替换文本
        formatPath[key] = formatPath[key].replace(result[0], formatData[result[1]])

        // 避免死循环 一般没啥问题
        out++
        if(out > 100) break
      }

    }

    return formatPath
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
