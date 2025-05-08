import type { IImgInfo } from 'picgo'
import type { IFtpLoaderPathInfo } from './config'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

export function formatPath(output: IImgInfo, userConfig: IFtpLoaderPathInfo): IFtpLoaderPathInfo {
  // 获取日期
  const date = new Date()

  const hashCache: Record<string, string | null> = { md5: null, sha1: null, sha256: null }
  const hash = function (algorithm: string) {
    if (!hashCache[algorithm]) {
      hashCache[algorithm] = createHash(algorithm)
        .update(
          output.base64Image
            ? new Uint8Array(Buffer.from(output.base64Image, 'base64').buffer)
            : new Uint8Array((output.buffer || Buffer.alloc(0)).buffer)
        )
        .digest('hex')
    }
    return hashCache[algorithm]
  }

  // 格式化数据
  const formatData: Record<string, any> = {
    // 时间
    timestamp: ((date.getTime() / 1000) | 0).toString(),
    year: `${date.getFullYear()}`,
    month: `0${date.getMonth() + 1}`.slice(-2),
    day: `0${date.getDate()}`.slice(-2),

    // 路径
    fullName: output.fileName,
    fileName: output.fileName!.replace(output.extname!, ''),
    ext: output.extname!.replace('.', ''),

    // 哈希值
    hash16: () => hash('md5').slice(0, 16),
    hash32: () => hash('md5'),
    md5sum: () => hash('md5'),
    sha1sum: () => hash('sha1'),
    sha256sum: () => hash('sha256')
  }

  // 未格式化路径
  const pathInfo: IFtpLoaderPathInfo = {
    path: userConfig.path,
    uploadPath: userConfig.uploadPath
  }

  // 替换后的路径
  const formatPath: IFtpLoaderPathInfo = {
    path: '',
    uploadPath: ''
  }

  for (const key in pathInfo) {
    // 确保 key 是 IFtpLoaderPathInfo 的键
    const typedKey = key as keyof IFtpLoaderPathInfo

    // 匹配 {} 内容
    const reg = /\{\w+(?::\d+:\d+)?\}/g
    let result: RegExpExecArray | null
    let newSubStr: string

    formatPath[typedKey] = pathInfo[typedKey]
    // eslint-disable-next-line no-cond-assign
    while ((result = reg.exec(pathInfo[typedKey]))) {
      const [target, keyName, start, end] = result

      newSubStr
        = typeof formatData[keyName] === 'function'
          ? formatData[keyName]()
          : formatData[keyName]

      if (start && end) {
        newSubStr = newSubStr.substring(Number(start), Number(end))
      }
      formatPath[typedKey] = formatPath[typedKey].replace(target, newSubStr)
    }
  }

  return formatPath
}
