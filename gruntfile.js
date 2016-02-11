module.exports = function(grunt){

	require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: { separator: '\n\n' },
			core : {
				src: ['LICENSE.txt','build/jquery.mapify.js'],
				dest: 'build/jquery.mapify.js'
			},
			css : {
				src: ['LICENSE.txt','build/jquery.mapify.css'],
				dest: 'build/jquery.mapify.css'
			}
		},
        uglify: {
		    build: {
		        files: {
		            'build/jquery.mapify.js': ['src/mapify.js']
		        }
		    }
		},
		postcss: {
			options: {
				map: false,
				processors: [
					require('autoprefixer')({browsers: ['last 3 version']})
				]
			},
			dist: {
				src: 'build/jquery.mapify.css'
			}
		},
		cssmin: {
		    build: {
		        src: 'build/jquery.mapify.css',
		        dest: 'build/jquery.mapify.css'
		    }
		},
		sass: {
			options: {
		    	sourcemap: 'none'
			},
		    build: {
		        files: {
		            'build/jquery.mapify.css': 'src/mapify.scss'
		        }
		    }
		},
		watch: {
		    js: {
		        files: ['src/mapify.js'],
		        tasks: ['buildjs']
		    },
		    css: {
		        files: ['src/mapify.scss'],
		        tasks: ['buildcss']
		    }
		}
    });

	grunt.registerTask('default', ['buildall','watch']);
	grunt.registerTask('buildall', ['buildcss','buildjs']);
	
	grunt.registerTask('buildcss', ['sass','postcss','cssmin','concat:css']);
	grunt.registerTask('buildjs', ['uglify:build','concat:core']);

};