
process.env.NODE_ENV = 'production'

const env = process.env.ENV || 'dev'

const { say } = require('cfonts')
const del = require('del')
var ora = require('ora')
var rm = require('rimraf')
var path = require('path')
var chalk = require('chalk')
const Multispinner = require('multispinner')
var webpack = require('webpack')

{{#if_eq builder 'packager'}}
const packager = require('electron-packager')
{{else}}
const { spawn } = require('child_process')
{{/if_eq}}

{{#if_eq builder 'packager'}}const buildConfig = require('./build.config'){{/if_eq}}

var config = require('./config')
var buildConfig = require('./electron.config')
var webpackConfig = require('./webpack.prod.conf')
var mainConfig = require('./webpack.main.conf')

var spinner = ora('building for production...')

const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '
const isCI = process.env.CI || false

if (process.env.BUILD_TARGET === 'clean') clean()
else if (process.env.BUILD_TARGET === 'web') web()
else build()

function web () {
  require('./check-versions')()
  spinner.start()
  rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
    if (err) throw err
    webpack(webpackConfig, function (err, stats) {
      spinner.stop()
      if (err) throw err
      process.stdout.write(stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
      }) + '\n\n')

      console.log(chalk.cyan('  Build complete.\n'))
      console.log(chalk.yellow(
        '  Tip: built files are meant to be served over an HTTP server.\n' +
        '  Opening index.html over file:// won\'t work.\n'
      ))
    })
  })
}

function clean () {
  del.sync([`platform/*`, '!platform/icons', '!platform/icons/icon.*'])
  console.log(`\n${doneLog}\n`)
  process.exit()
}

function build () {
  greeting()

  del.sync([`dist/electron/*`, '!.gitkeep'])

  const tasks = ['main', 'renderer']
  const m = new Multispinner(tasks, {
    preText: 'building',
    postText: 'process'
  })

  let results = ''

  m.on('success', () => {
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`\n\n${results}`)
    console.log(`${okayLog}take it away ${chalk.yellow('`electron-{{builder}}`')}\n`)
    {{#if_eq builder 'packager'}}bundleApp(){{else}}process.exit(){{/if_eq}}
  })

  pack(webpackConfig).then(result => {
    results += result + '\n\n'
    m.success('renderer')

    pack(mainConfig).then(result => {
      results += result + '\n\n'
      m.success('main')
    }).catch(err => {
      m.error('main')
      console.log(`\n  ${errorLog}failed to build main process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    })

  }).catch(err => {
    m.error('renderer')
    console.log(`\n  ${errorLog}failed to build renderer process`)
    console.error(`\n${err}\n`)
    process.exit(1)
  })
}

function pack (config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) {
        let err = ''

        stats.toString({
          chunks: false,
          colors: true
        })
        .split(/\r?\n/)
        .forEach(line => {
          err += `    ${line}\n`
        })

        reject(err)
      } else {
        resolve(stats.toString({
          chunks: false,
          colors: true
        }))
      }
    })
  })
}

{{#if_eq builder 'packager'}}
function bundleApp () {
  packager(buildConfig, (err, appPaths) => {
    console.log(buildConfig)
    if (err) {
      console.log(`\n${errorLog}${chalk.yellow('`electron-packager`')} says...\n`)
      console.log(err + '\n')
    } else {
      console.log(`\n${doneLog}\n`)
    }
  })
}
{{/if_eq}}

function greeting () {
  const cols = process.stdout.columns
  let text = ''

  if (cols > 85) text = 'lets-build'
  else if (cols > 60) text = 'lets-|build'
  else text = false

  if (text && !isCI) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold('\n  lets-build'))
  console.log()
}
