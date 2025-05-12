import type { IImgInfo } from 'picgo'
import type { FTPLoaderPathInfo } from './config'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

export function formatPath(output: IImgInfo, userConfig: FTPLoaderPathInfo): FTPLoaderPathInfo {
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
  const pathInfo: FTPLoaderPathInfo = {
    path: userConfig.path,
    uploadPath: userConfig.uploadPath
  }

  // 替换后的路径
  const formatPath: FTPLoaderPathInfo = {
    path: '',
    uploadPath: ''
  }

  for (const key in pathInfo) {
    // 确保 key 是 IFtpLoaderPathInfo 的键
    const typedKey = key as keyof FTPLoaderPathInfo

    // 匹配 {} 内容，改进正则表达式以正确提取变量名和参数
    const reg = /\{([^{}:]+)(?::(\d+):(\d+))?\}/g
    let result: RegExpExecArray | null

    formatPath[typedKey] = pathInfo[typedKey]

    // 临时存储结果，避免多次替换影响正则匹配
    let formattedString = pathInfo[typedKey]

    // eslint-disable-next-line no-cond-assign
    while ((result = reg.exec(pathInfo[typedKey]))) {
      const [target, keyName, start, end] = result

      // 检查变量是否存在
      if (formatData[keyName] === undefined) {
        continue
      }

      let newSubStr = typeof formatData[keyName] === 'function'
        ? formatData[keyName]()
        : formatData[keyName]

      // 只在变量存在且有范围指定时处理子字符串
      if (newSubStr !== undefined && start !== undefined && end !== undefined) {
        newSubStr = newSubStr.substring(Number(start), Number(end))
      }

      // 替换全部匹配到的目标
      formattedString = formattedString.replace(target, newSubStr !== undefined ? newSubStr : target)
    }

    formatPath[typedKey] = formattedString
  }

  return formatPath
}
