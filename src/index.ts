import type { IPicGo } from 'picgo'
import { config } from './config'
import { handle } from './handle'

export default (ctx: IPicGo) => {
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
