require('./check-versions')()
const electron = require('electron')
const { say } = require('cfonts')
const chalk = require('chalk')
const { spawn } = require('child_process')

var config = require('./config')
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var portfinder = require('portfinder')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

var mainConfig = require('./webpack.main.conf')
let electronProcess = null
let manualRestart = false
let hotMiddleware = null

// 渲染进程(web页面渲染)
function startRenderer () {
    // automatically open browser, if not set will be false
    var autoOpenBrowser = !!config.dev.autoOpenBrowser
    // Define HTTP proxies to your custom API backend
    // https://github.com/chimurai/http-proxy-middleware
    var proxyTable = config.dev.proxyTable

    var app = express()
    var compiler = webpack(webpackConfig)

    var devMiddleware = require('webpack-dev-middleware')(compiler, {
        publicPath: webpackConfig.output.publicPath,
        quiet: true
    })

    hotMiddleware = require('webpack-hot-middleware')(compiler, {
        log: () => { }
    })
    // force page reload when html-webpack-plugin template changes
    // compiler.plugin('compilation', function (compilation) {
    //     compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    //         hotMiddleware.publish({ action: 'reload' })
    //         cb()
    //     })
    // })

    // proxy api requests
    Object.keys(proxyTable).forEach(function (context) {
        var options = proxyTable[context]
        if (typeof options === 'string') {
            options = { target: options }
        }
        app.use(proxyMiddleware(options.filter || context, options))
    })

    // handle fallback for HTML5 history API
    app.use(require('connect-history-api-fallback')())

    // serve webpack bundle output
    app.use(devMiddleware)

    // enable hot-reload and state-preserving
    // compilation error display
    app.use(hotMiddleware)

    // serve pure static assets
    var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
    app.use(staticPath, express.static('./static'))

    // default port where dev server listens for incoming traffic
    portfinder.basePort = process.env.PORT || config.dev.port
    portfinder.getPort((err, port) => {
        if (err) {
            return false
        }

        var uri = 'http://localhost:' + port

        devMiddleware.waitUntilValid(function () {
            console.log('> Listening at ' + uri + '\n')
        })

        app.listen(port, function (err) {
            if (err) {
                console.log(err)
                return
            }

            // when env is testing, don't need open it
            if (autoOpenBrowser && process.env.NODE_ENV !== 'testing' && process.env.BABEL_ENV !== 'main') {
                opn(uri)
            }
        })
    })
}

// 日志
function logStats (proc, data) {
    let log = ''

    log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`)
    log += '\n\n'

    if (typeof data === 'object') {
      data.toString({
        colors: true,
        chunks: false
      }).split(/\r?\n/).forEach(line => {
        log += '  ' + line + '\n'
      })
    } else {
      log += `  ${data}\n`
    }

    log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n'

    console.log(log)
}

// 主进程
function startMain () {
    return new Promise((resolve, reject) => {
      mainConfig.entry.main = [path.join(__dirname, '../src/app/app.dev.ts')].concat(mainConfig.entry.main)

      const compiler = webpack(mainConfig)

      compiler.plugin('watch-run', (compilation, done) => {
        logStats('Main', chalk.white.bold('compiling...'))
        hotMiddleware.publish({ action: 'compiling' })
        done()
      })

      compiler.watch({}, (err, stats) => {
        if (err) {
          console.log(err)
          return
        }

        logStats('Main', stats)

        if (electronProcess && electronProcess.kill) {
          manualRestart = true
          process.kill(electronProcess.pid)
          electronProcess = null
          startElectron()

          setTimeout(() => {
            manualRestart = false
          }, 5000)
        }

        resolve()
      })
    })
}

function startElectron () {
    electronProcess = spawn(electron, ['--inspect=5858', path.join(__dirname, `../dist/electron/main.js`)])

    electronProcess.stdout.on('data', data => {
      electronLog(data, 'blue')
    })
    electronProcess.stderr.on('data', data => {
      electronLog(data, 'red')
    })

    electronProcess.on('close', () => {
      if (!manualRestart) process.exit()
    })
  }

  function electronLog (data, color) {
    let log = ''
    data = data.toString().split(/\r?\n/)
    data.forEach(line => {
      log += `  ${line}\n`
    })
    if (/[0-9A-z]+/.test(log)) {
      console.log(
        chalk[color].bold('┏ Electron -------------------') +
        '\n\n' +
        log +
        chalk[color].bold('┗ ----------------------------') +
        '\n'
      )
    }
}

function greeting () {
    const cols = process.stdout.columns
    let text = ''

    if (cols > 104) text = 'electron-vue'
    else if (cols > 76) text = 'electron-|vue'
    else text = false

    if (text) {
      say(text, {
        colors: ['yellow'],
        font: 'simple3d',
        space: false
      })
    } else console.log(chalk.yellow.bold('\n  electron-vue'))
    console.log(chalk.blue('  getting ready...') + '\n')
}

function init () {
    greeting()

    Promise.all([startRenderer(), startMain()])
      .then(() => {
        startElectron()
      })
      .catch(err => {
        console.error(err)
      })
  }

init()
