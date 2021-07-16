import { IFtpLoaderPathInfo } from './config'
import { IImgInfo } from 'picgo/dist/src/types'
import crypto from 'crypto'

export const formatPath = (
  output: IImgInfo,
  userConfig: IFtpLoaderPathInfo
): IFtpLoaderPathInfo => {
  // 获取日期
  let date = new Date()

  // 格式化数据
  let formatData = {
    // 路径
    year: `${date.getFullYear()}`,
    month:
      date.getMonth() < 9
        ? `0${date.getMonth() + 1}`
        : `${date.getMonth() + 1}`,

    // 文件名
    fullName: output.fileName,
    fileName: output.fileName.replace(output.extname, ''),
    hash16: crypto
      .createHash('md5')
      .update(
        output.base64Image ? output.base64Image : output.buffer.toString()
      )
      .digest('hex')
      .substr(0, 16),
    hash32: crypto
      .createHash('md5')
      .update(
        output.base64Image ? output.base64Image : output.buffer.toString()
      )
      .digest('hex'),

    // 后缀名
    ext: output.extname.replace('.', '')
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
    let out = 0
    let reg = /(?:{(\w+)})/g
    formatPath[key] = pathInfo[key]
    let result: RegExpExecArray
    while ((result = reg.exec(pathInfo[key]))) {
      // 替换文本
      formatPath[key] = formatPath[key].replace(
        result[0],
        formatData[result[1]]
      )

      // 避免死循环 一般没啥问题
      out++
      if (out > 100) break
    }
  }

  return formatPath
}
