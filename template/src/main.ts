import 'vue-svgicon/dist/polyfill'
import Vue from 'vue'

// register plugins hooks fo vue component
import 'common/registerHooks'

import * as svgicon from 'vue-svgicon'
// import all icons
import 'components/icons'

import router from 'router'
import store from 'store'

import App from 'components/pages/app'

// import all icons
import 'components/icons'
Vue.use(svgicon, {
    tagName: 'icon'
})

// electron
if (process.env.NODE_ENV !== 'development' && process.env.BUILD_TARGET !== 'web') {
    global.__static = './static'
} else {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

new Vue({
    el: '#app',
    router,
    store,
    render: h => h(App)
})
declare var require: NodeRequire;
