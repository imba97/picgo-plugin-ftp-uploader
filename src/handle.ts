import type { IPicGo } from 'picgo'
import type { IFtpLoaderUserConfig } from './config'
import { getFtpConfig } from './config'
import { useFtpUploader } from './ftp'
import { useUploader } from './upload'

export async function handle(ctx: IPicGo) {
  const userConfig: IFtpLoaderUserConfig = ctx.getConfig('picBed.ftp-uploader')
  if (!userConfig) {
    throw new Error('Can\'t find uploader config')
  }

  const configItem = await getFtpConfig(userConfig)
  const config = configItem[userConfig.site]

  const client = useFtpUploader()

  await client.connect({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    secure: false
  })

  const input = ctx.input
  const output = ctx.output
  let filesCount = output.length

  const { upload, uploadBuffer } = useUploader(ctx, client, config)

  for (let i = 0; i < input.length; i++) {
    const localPath = input[i]
    const buffer = output[i].buffer

    const uploadPromise = buffer
      ? uploadBuffer(buffer, i)
      : upload(localPath, i)

    await uploadPromise
      .then((path) => {
        const imgUrl = `${
          /\/$/.test(config.url)
            ? config.url.slice(0, config.url.length)
            : config.url
        }${path}`

        output[i].url = imgUrl
        output[i].imgUrl = imgUrl

        filesCount--
        if (filesCount <= 0)
          client.end()
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
