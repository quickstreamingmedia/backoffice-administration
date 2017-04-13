'use strict';

/**
 * Module dependencies.
 */

//sample api doc generation command
//apidoc -i modules\deviceapiv2\server\controllers -o public\apidoc


var _ = require('lodash'),
    defaultAssets = require('./config/assets/default'),
    testAssets = require('./config/assets/test'),
    fs = require('fs'),
    path = require('path');

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        env: {
            test: {
                NODE_ENV: 'test'
            },
            dev: {
                NODE_ENV: 'development'
            },
            prod: {
                NODE_ENV: 'production'
            }
        },
        watch: {
            serverViews: {
                files: defaultAssets.server.views,
                options: {
                    livereload: true
                }
            },
            serverJS: {
                files: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS),
                //tasks: ['jshint'],
                options: {
                    livereload: true
                }
            }

        },
        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    nodeArgs: ['--debug'],
                    //ext: 'js,html',
                    watch: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
                }
            }
        },
        concurrent: {
            default: ['nodemon', 'watch'],
            debug: ['nodemon', 'watch', 'node-inspector'],
            options: {
                logConcurrentOutput: true
            }
        },
        jshint: {
            all: {
                src: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS,  testAssets.tests.server, testAssets.tests.client, testAssets.tests.e2e),
                options: {
                    jshintrc: true,
                    node: true,
                    mocha: true,
                    jasmine: true
                }
            }
        },

        'node-inspector': {
            custom: {
                options: {
                    'web-port': 1337,
                    'web-host': 'localhost',
                    'debug-port': 5858,
                    'save-live-edit': true,
                    'no-preload': true,
                    'stack-trace-limit': 50,
                    'hidden': []
                }
            }
        },
        apidoc: {
            myapp: {
                src: "modules\\deviceapiv2\\server\\controllers\\",
                dest: "public\\apidoc\\",
                options: {
                    debug: true,
                    includeFilters: [ ".*\\.js$" ],
                    excludeFilters: [ "node_modules/" ]
                }

            }
        }
    });

    grunt.event.on('coverage', function(lcovFileContents, done) {
        require('coveralls').handleInput(lcovFileContents, function(err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });

    // Load NPM tasks
    require('load-grunt-tasks')(grunt);
    //require('grunt-apidoc')(grunt);

    grunt.loadNpmTasks('grunt-apidoc');

    // Make sure upload directory exists
    grunt.task.registerTask('mkdir:upload', 'Task that makes sure upload directory exists.', function() {
        // Get the callback
        var done = this.async();

        grunt.file.mkdir(path.normalize(__dirname + '/public/uploads/users/profile'));

        done();
    });


    grunt.task.registerTask('server', 'Starting the server', function() {
        // Get the callback
        var done = this.async();

        var path = require('path');
        var app = require(path.resolve('./config/lib/app'));
        var server = app.start(function() {
            setTimeout(function() { //for sequelize.sync()
                done();
            }, 10000);
        });
    });


    // Lint CSS and JavaScript files.
    //grunt.registerTask('lint', ['sass', 'less', 'jshint', 'csslint']);
    //FIXME: JSHint removed temporary
    //grunt.registerTask('lint', ['sass', 'less']);

    // Lint project files and minify them into two production files.
    //grunt.registerTask('build', ['env:dev', 'lint', 'ngAnnotate', 'uglify', 'cssmin']);

    // Run the project tests
    //TODO return 'karma:unit'
    // grunt.registerTask('test', ['env:test', 'lint', 'mkdir:upload', 'copy:localConfig', 'server', 'mochaTest']);
    // grunt.registerTask('test:server', ['env:test', 'lint', 'server', 'mochaTest']);
    // grunt.registerTask('test:client', ['env:test', 'lint', 'server', 'karma:unit']);

    // Run project coverage
    //grunt.registerTask('coverage', ['env:test', 'lint', 'mocha_istanbul:coverage']);

    // Run the project in development mode
    grunt.registerTask('default', ['env:dev',  'mkdir:upload', 'apidoc:myapp', 'concurrent:default']);

    // Run the project in debug mode
    //grunt.registerTask('debug', ['env:dev', 'lint', 'mkdir:upload', 'copy:localConfig', 'concurrent:debug']);

    // Run the project in production mode
    grunt.registerTask('prod', ['build', 'env:prod', 'mkdir:upload',  'concurrent:default']);




};
