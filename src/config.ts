import type { IPicGo, IPluginConfig } from 'picgo'
import fs from 'node:fs'
import { request } from 'node:https'
import { URL } from 'node:url'

export function config(ctx: IPicGo): IPluginConfig[] {
  let userConfig = ctx.getConfig<FTPLoaderUserConfig>('picBed.ftp-uploader')
  if (!userConfig) {
    userConfig = {
      site: '',
      configFile: ''
    }
  }

  return [
    {
      name: 'site',
      type: 'input',
      default: userConfig.site,
      required: true,
      message: 'imba97',
      alias: '网站标识'
    },
    {
      name: 'configFile',
      type: 'input',
      default: userConfig.configFile,
      required: true,
      message: 'D:/ftpUploaderConfig.json',
      alias: '配置文件'
    }
  ]
}

export function getFtpConfig(userConfig: FTPLoaderUserConfig): Promise<{ [key: string]: FTPLoaderUserConfigItem }> {
  return new Promise((resolve, reject) => {
    // 判断是否是网络请求
    if (userConfig.configFile.startsWith('http')) {
      // 使用统一的请求方法
      const url = new URL(userConfig.configFile)
      const req = request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          method: 'GET',
          protocol: url.protocol
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(res.statusCode)
            res.resume()
            return
          }

          res.setEncoding('utf8')
          let body = ''
          res.on('data', (chunk) => {
            body += chunk
          })
          res.on('end', () => {
            resolve(JSON.parse(body))
          })
        }
      )

      req.on('error', (e) => {
        reject(e.message)
      })
      req.end()
    }
    else {
      // 本地
      resolve(JSON.parse(fs.readFileSync(userConfig.configFile).toString()))
    }
  })
}

export interface FTPLoaderUserConfig {
  site: string
  configFile: string
}

export interface FTPLoaderUserConfigItem {
  url: string
  path: string
  uploadPath: string
  host: string
  port: number
  username?: string
  password?: string
}

export interface FTPLoaderPathInfo {
  path: string
  uploadPath: string
}
