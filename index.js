const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const chalk = require('chalk')
const stripJsonComments = require('strip-json-comments')

function wgtBuild(env) {
  // 校验env
  if (!['production', 'development'].includes(env))
    return console.log(chalk.red(`env must be production or development, but got ${env}`))

  const envMap = {
    production: 'build',
    development: 'dev',
  }
  const cwd = process.cwd()
  const distPath = path.resolve(cwd, 'dist', envMap[env])

  // 检测 app-plus 目录是否存在
  if (!fs.existsSync(path.resolve(distPath, 'app-plus')))
    return console.log(chalk.red(`app-plus not exists in ${distPath}`))

  // 检测 manifest.json 是否存在
  const manifestPath = path.resolve(cwd, 'src/manifest.json')
  if (!fs.existsSync(manifestPath))
    return console.log(chalk.red(`manifest.json not exists in ${cwd}/src`))

  console.log(chalk.green(`wgt build start in ${distPath}`))

  // 获取 manifest.json 内容
  const file = fs.readFileSync(manifestPath, { encoding: 'utf-8' })
  const manifest = JSON.parse(stripJsonComments(file))
  const { appid, versionName } = manifest

  const fileName = `${appid || 'app-plus'}@${versionName || '1.0.0'}`

  // 压缩 app-plus 目录
  const folderPath = path.resolve(distPath, 'app-plus')
  const zipPath = path.resolve(distPath, `${fileName}.zip`)
  zipFolder(folderPath, zipPath)

  // 判断是否有同名 wgt 文件，有则删除
  const wgtPath = path.resolve(distPath, `${fileName}.wgt`)
  if (fs.existsSync(wgtPath))
    fs.unlinkSync(wgtPath)

  // 重命名 .zip 为 .wgt
  fs.renameSync(zipPath, wgtPath)

  console.log(chalk.green(`wgt build success in ${wgtPath}`))
}

function zipFolder(folderPath, zipPath) {
  try {
    const zip = new AdmZip()
    zip.addLocalFolder(folderPath)
    zip.writeZip(zipPath)
  }
  catch (err) {
    console.log(chalk.red(err))
  }
}

module.exports = (api) => {
  api.registerCommand('wgt-build', {
    description: 'build uni-app wgt',
    usage: 'vue-cli-service wgt-build [options]',
    options: {
      '--env': 'specify env mode (default: production)',
    },
  }, (args) => {
    wgtBuild(args.env || 'production')
  })
}
