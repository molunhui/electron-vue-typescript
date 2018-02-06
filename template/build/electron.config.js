const path = require('path')

/**
 * `electron-packager` options
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-packager.html
 */
module.exports = {
  arch: 'x64',
  asar: true,
  dir: path.join(__dirname, '../'),
  icon: path.join(__dirname, '../platform/icons/icon'),
  ignore: /(^\/(src|test|\.[a-z]+|README|node_modules|build|yarn|static|dist\/(sit|prod)))|\.gitkeep/,
  out: path.join(__dirname, '../platform'),
  overwrite: true,
  platform: process.env.BUILD_TARGET || 'all'
}
