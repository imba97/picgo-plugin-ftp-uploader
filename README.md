## picgo-plugin-ftp-uploader

PicGo FTP 上传插件

## 配置

配置分为“插件配置”和“配置文件配置”

**插件配置**是在插件中配置

**配置文件配置**是需要自行创建一个`json`文件进行配置

### 插件配置

| 名称     | 介绍                 | 配置示例            |
| -------- | -------------------- | ------------------- |
| 网站标识 | 多个 FTP 站的标识    | imba97              |
| 配置文件 | 配置文件的路径或 URL | D:/ftpUploader.json |

**关于配置文件**

可以是本地文件，如 `D:/ftpUploader.json`
也可以是网络文件，如 `https://imba97.cn/ftpUploader.json`

### 配置文件配置

配置文件是一个`json`文件，你可以在里面配置多个 FTP 服务器的信息

例：

```json
{
  "imba97": {
    "url": "https://imba97.cn",
    "path": "/imba97_cn/{year}/{month}/{fullName}",
    "uploadPath": "/Web/imba97_cn/{year}/{month}/{fullName}",
    "host": "1.2.3.4",
    "port": 21,
    "username": "ftpUser1",
    "password": "ftpPassword1"
  },
  "btools": {
    "url": "https://btools.cc",
    "path": "/btools_cc/{year}/{month}/{fullName}",
    "uploadPath": "/Web/btools_cc/{year}/{month}/{fullName}",
    "host": "1.2.3.4",
    "port": 21,
    "username": "ftpUser2",
    "password": "ftpPassword2"
  }
}
```

| 名称       | 介绍                        | 配置示例                                |
| ---------- | --------------------------- | --------------------------------------- |
| url        | 图片网站的域名              | https://imba97.cn                       |
| path       | 图片的路径                  | /uploads/{year}/{month}/{fullName}      |
| uploadPath | 文件在 FTP 服务器的真实路径 | /blog/uploads/{year}/{month}/{fullName} |
| host       | FTP 地址                    | 233.233.233.233                         |
| port       | FTP 端口                    | 21                                      |
| username   | 用户名                      | imba97                                  |
| password   | 密码                        | imba97                                  |

可通过配置网站标识`imba97`、`btools`来上传到不同的位置

## 路径 Format

路径配置可使用以下参数，使用示例：`/{year}/{month}/{fullName}`，输出示例：`/2020/01/imba97.png`

| 名称     | 介绍           | 输出示例                         |
| -------- | -------------- | -------------------------------- |
| year     | 当前年份       | 2021                             |
| month    | 当前月份       | 01                               |
| fullName | 图片全名       | imba97.png                       |
| fileName | 图片名称       | imba97                           |
| hash16   | 图片 MD5 16 位 | 68559cae1081d683                 |
| hash32   | 图片 MD5 32 位 | 68559cae1081d6836e09b043aa0b3af1 |
| ext      | 图片后缀名     | png                              |

**注意**：除了`fullName`，其他都需要自行添加后缀名

## 路径配置示例

**网址路径**和**文件路径**的配置示例

比如我服务器有这样一个路径：`/www/wwwroot/blog/uploads/`，图片在里面

我的网站根目录是`/www/wwwroot/blog/`，而 FTP 根目录是`/www/wwwroot/`

那么我可以把**网址路径**设置为`/uploads/{year}/{month}/{fullName}`

**文件路径**设置为`/blog/uploads/{year}/{month}/{fullName}`

## 贡献

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
