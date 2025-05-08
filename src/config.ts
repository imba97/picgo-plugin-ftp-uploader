import type { IPicGo, IPluginConfig } from 'picgo'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import process from 'node:process'

export function config(ctx: IPicGo): IPluginConfig[] {
  let userConfig = ctx.getConfig<IFtpLoaderUserConfig>('picBed.ftp-uploader')
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

export function getFtpConfig(userConfig: IFtpLoaderUserConfig): Promise<{ [key: string]: IFtpLoaderUserConfigItem }> {
  return new Promise((resolve, reject) => {
    // 兼容 https
    let request: typeof http | typeof https | null = null

    if (userConfig.configFile.startsWith('https')) {
      request = https
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }
    else if (userConfig.configFile.startsWith('http')) {
      request = http
    }

    // 如果是网址 则用 http 否则是本地 用 fs
    if (request !== null) {
      // 网络
      request
        .get(userConfig.configFile, (res) => {
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
        })
        .on('error', (e) => {
          reject(e.message)
        })
    }
    else {
      // 本地
      resolve(JSON.parse(fs.readFileSync(userConfig.configFile).toString()))
    }
  })
}

export interface IFtpLoaderUserConfig {
  site: string
  configFile: string
}

export interface IFtpLoaderUserConfigItem {
  url: string
  path: string
  uploadPath: string
  host: string
  port: number
  username?: string
  password?: string
}

export interface IFtpLoaderPathInfo {
  path: string
  uploadPath: string
}
