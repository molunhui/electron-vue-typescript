module.exports = {
  "helpers": {
    "if_or": function (v1, v2, options) {
      if (v1 || v2) {
        return options.fn(this);
      }

      return options.inverse(this);
    }
  },
  "prompts": {
    "name": {
      "type": "string",
      "required": true,
      "label": "Project name"
    },
    "description": {
      "type": "string",
      "required": true,
      "label": "Project description",
      "default": "An electron-vue-typescript project"
    },
    "author": {
      "type": "string",
      "label": "Author"
    },
    "ie": {
      "type": "confirm",
      "message": "Support IE or older browser?"
    },
    "vuex": {
      "type": "confirm",
      "message": "Use vuex?"
    },
    "builder": {
      type: 'list',
      message: 'What build tool would you like to use?',
      choices: [
        {
          name: 'electron-packager (https://github.com/electron-userland/electron-packager)',
          value: 'packager',
          short: 'packager'
        },
        {
          name: 'electron-builder (https://github.com/electron-userland/electron-builder)',
          value: 'builder',
          short: 'builder'
        }
      ]
    }
  },
  "filters": {
    "src/components/views/todo/**/*": "vuex",
    "src/store/**/*": "vuex",
    "typings/interface/todo.d.ts": "vuex",
    "typings/interface/state.d.ts": "vuex"
  },
  "completeMessage": "{{#inPlace}}To get started:\n\n  npm install\n  npm run dev.{{else}}To get started:\n\n  cd {{destDirName}}\n  npm install\n  npm run dev.{{/inPlace}}"
}
