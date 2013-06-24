module.exports = function( grunt ) {

  grunt.initConfig({


    pkg: grunt.file.readJSON( 'package.json' ),


    uglify: {
      dist: {
        files: {
          expand: true,
          cwd: 'public/js',
          src: ['*.js'],
          dest: '<%= uglify.dist.files.cwd %>',
          ext: '.min.js'
        }
      }
    },


    jshint: {
      js: {
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        forin: true,
        latedef: true,
        plusplus: true,
        undef: true,
        unused: true,
        strict: true,

        laxcomma: true,
        loopfunc: true,

        jquery: true,
        node: true
      }
    },


    watch: {
      js: {
        files: '/public/js/*.js',
        tasks: [ 'uglify', 'jshint' ]
      }
    },


    nodemon: {
      dev: {}
    }


  });


  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-nodemon' );


  grunt.registerTask( 'default', [ 'uglify', 'jshint' ] );
};