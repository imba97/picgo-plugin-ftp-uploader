import Client from 'ftp'

export class FtpUploader {
  private client: Client

  constructor() {
    this.client = new Client()
  }

  public async upload(localPath: string, remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.put(localPath, remotePath, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  public async connect(config: Client.Options): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.connect(config)
      this.client.on('ready', () => resolve())
      this.client.on('error', err => reject(err))
    })
  }

  public async ensureDir(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.mkdir(remotePath, true, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  public async uploadFrom(localPath: string, remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.put(localPath, remotePath, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  public async delete(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.delete(remotePath, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  public end() {
    this.client.end()
  }
}

export function useFtpUploader() {
  return new FtpUploader()
}
