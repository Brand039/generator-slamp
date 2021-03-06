// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';
var yeoman = require('yeoman-generator');

module.exports = yeoman.generators.Base.extend({

  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
    this.option('withConfig', {
      desc: 'compose with config',
      type: Boolean,
      default: false
    });
  },

  initializing: function() {
    if (!this.config.get('siteDir') && !this.options.withConfig) {
      this.composeWith('slamp:config');
    }
  },

  check: function() {
    return this.config.get('buildSystem') === 'grunt';
  },

  writing: {
    gruntfile: function() {

      if (!this.check()) { return; }

      var overrides = {
        jquery: {
          main: 'dist/jquery.min.js'
        },
        bootstrap: {
          main: [
              'dist/css/bootstrap.min.css',
              'dist/js/bootstrap.min.js'
          ]
        },
        angular: {
          main: 'angular.min.js'
        },
        react: {
          main: 'react.min.js'
        }
      };

      this.siteDir = this.config.get('siteDir');

      this.gruntfile.loadNpmTasks([
        'grunt-wiredep',
        'grunt-wiredep-copy',
        'grunt-contrib-watch',
        'grunt-contrib-uglify',
        'grunt-contrib-cssmin',
        'grunt-newer'
      ]);

      this.gruntfile.insertConfig('wiredepCopy', JSON.stringify({
        dev: {
          options: {
            src: '.',
            dest: this.siteDir
          }
        },
        prod: {
          options: {
            src: '.',
            dest: this.siteDir,
            wiredep: {
              overrides: overrides
            }
          }
        }
      }));
      this.gruntfile.insertConfig('wiredep', JSON.stringify({
        dev: {
          src: [this.siteDir + '/default.page.php'],
          ignorePath: '../'
        },
        prod: {
          src: [this.siteDir + '/default.page.php'],
          ignorePath: '../',
          overrides: overrides
        }
      }));
      this.gruntfile.insertConfig('uglify', JSON.stringify({
        dist: {
          options: {
            sourceMap: true,
            compress: {
              drop_console: true
            }
          },
          files: [{
            expand: true,
            cwd: this.siteDir + '/js',
            src: ['*.js', '!*.min.js'],
            dest: this.siteDir + '/js/min',
            ext: '.min.js'
          }]
        }
      }));
      this.gruntfile.insertConfig('cssmin', JSON.stringify({
        dist: {
          options: {
            sourceMap: true
          },
          files: [{
            expand: true,
            cwd: this.siteDir + '/css',
            src: ['*.css', '!*.min.css'],
            dest: this.siteDir + '/css/min',
            ext: '.min.css'
          }]
        }
      }));
      this.gruntfile.insertConfig('watch', JSON.stringify({
        bower: {
          files: ['bower_components/*'],
          tasks: ['bower']
        },
        js: {
          files: [this.siteDir + '/js/*.js'],
          tasks: ['newer:uglify']
        },
        css: {
          files: [this.siteDir + '/css/*.css'],
          tasks: ['newer:cssmin']
        }
      }));
      this.gruntfile.registerTask('minify', ['newer:uglify', 'newer:cssmin']);
      this.gruntfile.registerTask('bower', [
        'wiredepCopy:prod',
        'wiredep:prod'
      ]);
      this.gruntfile.registerTask('default', ['bower', 'minify', 'watch']);
    }
  },

  install: function() {

    if (!this.check()) { return; }

    this.npmInstall([
      'grunt',
      'grunt-contrib-watch',
      'grunt-wiredep',
      'grunt-wiredep-copy',
      'grunt-contrib-uglify',
      'grunt-contrib-cssmin',
      'grunt-newer'
    ], {'saveDev': true});
  }
});
