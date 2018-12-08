let 	syntax = 'scss'; // Syntax: scss, sass, less or styl for stylus;

let 	gulp          = require('gulp'),
		gutil         = require('gulp-util'),
		sass          = require('gulp-sass'),
		less          = require('gulp-less'),
		styl          = require('gulp-stylus'),
		browserSync   = require('browser-sync'),
		concat        = require('gulp-concat'),
		uglify        = require('gulp-uglify'),
		cssnano       = require('cssnano'),
		rename        = require('gulp-rename'),
		autoprefixer  = require('autoprefixer');
		notify        = require("gulp-notify"),
		rsync         = require('gulp-rsync'),
		smartgrid     = require('smart-grid'),
		del           = require('del'),
		babel 		  = require('gulp-babel'),
		sourcemaps    = require('gulp-sourcemaps'),
		postcss    	  = require('gulp-postcss'),									
		assets        = require('postcss-assets'),
		mqpacker      = require('css-mqpacker'),
		sortCSSmq     = require('sort-css-media-queries'),
		stripUnits    = require('postcss-strip-units');
		

let plugins = [
		assets({
			loadPaths: ['app/assets/fonts/**/*', 'app/assets/img/'],
			relativeTo: 'app/assets/css/'
		}),
		stripUnits,
		mqpacker({
			sort: sortCSSmq
		}),
		autoprefixer(['> 1%', 'last 4 versions']),
		cssnano() // Opt., comment out when debugging
		];		

let settings = {
    outputStyle: ''+syntax+'', /* less || scss || sass || styl */
    columns: 12, /* number of grid columns */
    offset: '30px', /* gutter width px || % || rem */
    mobileFirst: false, /* mobileFirst ? 'min-width' : 'max-width' */
    container: {
        maxWidth: '1200px', /* max-width оn very large screen */
        fields: '30px' /* side fields */
    },
    breakPoints: {
        lg: {
            width: '1100px', /* -> @media (max-width: 1100px) */
        },
        md: {
            width: '960px'
        },
        sm: {
            width: '780px',
            fields: '15px' /* set fields only if you want to change container.fields */
        },
        xs: {
            width: '560px'
        }
        /* 
        We can create any quantity of break points.

        some_name: {
            width: 'Npx',
            fields: 'N(px|%|rem)',
            offset: 'N(px|%|rem)'
        }
        */
    }
};

gulp.task('grid', function() {
	smartgrid('app/assets/'+syntax+'/', settings);
});

gulp.task('default', ['watch']); // gulp --type production

gulp.task('clean', function() {
	return del.sync('dist');
});

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		},
		// proxy: 'gulp',
		notify: false,
		open: true,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
	})
});

let precss = {
	val: '',
	option: ''
}

switch (syntax) {
	default:
		syntax = "scss";
	case "scss":
    case "sass":
	    precss.val = sass;
	    precss.option = '';
        break;
    case "less":
	    precss.val  = less;
	    precss.option = '';
   		break;  
    case "styl":
	    precss.val  = styl;
	    precss.option = {'include css': true};
      	break;
}

gulp.task('styles', function() {
		// return gulp.src(['app/assets/'+syntax+'/**/*.'+syntax+'', '!app/assets/'+syntax+'/**/_*'])
		return gulp.src([`app/assets/${syntax}/**/*.${syntax}`, `!app/assets/${syntax}/**/*_`])
		.pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.init())
		.pipe(precss.val(precss.option).on("error", notify.onError()))
		.pipe(postcss(plugins).on("error", notify.onError()))
		.pipe(rename({ suffix: '.min', prefix : '' }))
		.pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.write('.'))
		.pipe(gulp.dest('app/assets/css'))	
		.pipe(browserSync.stream())
});

gulp.task('js', function() {
	return gulp.src([
		'app/assets/libs/jquery/dist/jquery.min.js',
		'app/assets/libs/jquery.maskedinput.min.js',
		'app/assets/libs/scroll.js',
		'app/assets/js/common.js', // Always at the end
		])
	.pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.init())
	.pipe(concat('scripts.min.js'))
	.pipe(gutil.env.type === 'production' ? babel({presets: ['@babel/env']}) : gutil.noop())
	.pipe(gutil.env.type === 'production' ? uglify() : gutil.noop()) // Mifify js (opt.)
	.pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.write('.'))
	.pipe(gulp.dest('app/assets/js'))
	.pipe(browserSync.reload({ stream: true }))
});

gulp.task('rsync', function() {
	return gulp.src('app/**')
	.pipe(rsync({
		root: 'app/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Includes files to deploy
		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
});

gulp.task('watch', ['styles', 'js', 'browser-sync'], function() {
	gulp.watch('app/assets/'+syntax+'/**/*.'+syntax+'', ['styles']);
	gulp.watch(['libs/**/*.js', 'app/assets/js/common.js'], ['js']);
	gulp.watch('app/**/*.php', browserSync.reload);
	gulp.watch('app/*.html', browserSync.reload)
});

gulp.task('set-type-production', function(){
	gutil.env.type = 'production';
});

gulp.task('build', ['set-type-production', 'clean', 'styles', 'js'], function(){
	
	let buildCss = gulp.src('app/assets/css/**/*.css')
	.pipe(gulp.dest('dist/assets/css'))

	let buildFonts = gulp.src('app/assets/fonts/**/*')
	.pipe(gulp.dest('dist/assets/fonts'))

	let buildImg = gulp.src('app/assets/img/**/*')
	.pipe(gulp.dest('dist/assets/img'))

	let buildJs = gulp.src('app/assets/js/scripts.min.js')
	.pipe(gulp.dest('dist/assets/js'))

	let buildHtml = gulp.src('app/*.html')
	.pipe(gulp.dest('dist'));

	let buildPhp = gulp.src('app/**/*.php')
	.pipe(gulp.dest('dist'));

});