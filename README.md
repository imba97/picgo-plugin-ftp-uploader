## picgo-plugin-ftp-uploader

PicGo FTP 上传插件

## 配置

名称 | 介绍 | 配置示例
-|-|-
域名地址 | 图片网站的域名 | https://imba97.cn
网址路径 | 图片的路径 | /uploads/{year}/{month}/{fullName}
文件路径 | 文件在FTP服务器的真实路径 | /blog/uploads/{year}/{month}/{fullName}
FTP地址 | 略 | 233.233.233.233
端口 | 略 | 21
用户名 | 略 | imba97
密码 | 略 | imba97

最终返回的地址是 **域名地址** + **网址路径**

## 路径 Format

路径配置可使用以下参数，使用示例：`/{year}/{month}/{fullName}`，输出示例：`/2020/01/imba97.png`

名称 | 介绍 | 输出示例
-|-|-
year | 当前年份 | 2021
month | 当前月份 | 01
fullName | 图片全名 | imba97.png
fileName | 图片名称 | imba97
hash16 | 图片 MD5 16位 | 68559cae1081d683
hash32 | 图片 MD5 32位 | 68559cae1081d6836e09b043aa0b3af1
ext | 图片后缀名 | png

**注意**：除了`fullName`，其他都需要自行添加后缀名

## 路径配置示例

**网址路径**和**文件路径**的配置示例

比如我服务器有这样一个路径：`/www/wwwroot/blog/uploads/`，图片在里面

我的网站根目录是`/www/wwwroot/blog/`，而FTP根目录是`/www/wwwroot/`

那么我可以把**网址路径**设置为`/uploads/{year}/{month}/{fullName}`

**文件路径**设置为`/blog/uploads/{year}/{month}/{fullName}`