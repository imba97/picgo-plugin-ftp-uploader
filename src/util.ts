import { Buffer } from 'buffer'
import { createHash } from 'crypto'
import { IFtpLoaderPathInfo } from './config'
import type { IImgInfo } from 'picgo'

export const formatPath = (
  output: IImgInfo,
  userConfig: IFtpLoaderPathInfo
): IFtpLoaderPathInfo => {
  // 获取日期
  let date = new Date()

  let hashCache = { md5: null, sha1: null, sha256: null }
  const hash = function (algorithm) {
    if (!hashCache[algorithm]) {
      hashCache[algorithm] = createHash(algorithm)
        .update(
          output.base64Image
            ? Buffer.from(output.base64Image, 'base64')
            : output.buffer
        )
        .digest('hex')
    }
    return hashCache[algorithm]
  }

  // 格式化数据
  let formatData = {
    // 时间
    timestamp: ((date.getTime() / 1000) | 0).toString(),
    year: `${date.getFullYear()}`,
    month: `0${date.getMonth() + 1}`.substr(-2),
    day: `0${date.getDate()}`.substr(-2),

    // 路径
    fullName: output.fileName,
    fileName: output.fileName.replace(output.extname, ''),
    ext: output.extname.replace('.', ''),

    // 哈希值
    hash16: () => hash('md5').substr(0, 16),
    hash32: () => hash('md5'),
    md5sum: () => hash('md5'),
    sha1sum: () => hash('sha1'),
    sha256sum: () => hash('sha256')
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

  for (let key in pathInfo) {
    // 匹配 {} 内容
    let reg = /(?:{((\w+)(?::(\d+):(\d+))?)})/g
    let result: RegExpExecArray
    let newSubStr: String

    formatPath[key] = pathInfo[key]
    while ((result = reg.exec(pathInfo[key]))) {
      newSubStr =
        typeof formatData[result[2]] === 'function'
          ? formatData[result[2]]()
          : formatData[result[2]]
      if (result[3] && result[4]) {
        newSubStr = newSubStr.substring(Number(result[3]), Number(result[4]))
      }
      formatPath[key] = formatPath[key].replace(result[0], newSubStr)
    }
  }

  return formatPath
}
