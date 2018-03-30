/* ==========================================================================
   #GULPFILE
   ========================================================================== */




//
// Dependencies
//

const nunjucks = require('gulp-nunjucks');
const browserSync = require('browser-sync');
const csso = require('gulp-csso');
const del = require('del');
const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const prefix = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const reload = browserSync.reload;
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const webpack = require('webpack');




//
// Options
//

const config = {
	dev: gutil.env.dev,
	styles: {
		browsers: 'last 2 versions',
		src: 'src/styles/themes/*.scss',
		dest: 'dist/assets/styles',
		watch: 'src/assets/styles/**/*.scss',
	},
	scripts: {
		src: './src/scripts/toolkit.js',
		dest: 'dist/assets/scripts',
		watch: 'src/assets/scripts/**/*',
	},
	images: {
		src: 'src/assets/images/**/*',
		dest: 'dist/assets/images',
		watch: 'src/assets/images/**/*',
	},
	templates: {
		src: 'src/templates/*.{html,nunjucks,njk}',
		watch: 'src/**/*.{html,nunjucks,njk,md,json,yml}',
	},
	dest: 'dist',
};




//
// Clean
//

gulp.task('clean', del.bind(null, [config.dest]));




//
// Styles
//

gulp.task('styles', () => {
	gulp.src(config.styles.src)
	.pipe(sass({
		includePaths: './node_modules',
	}).on('error', sass.logError))
	.pipe(prefix(config.styles.browsers))
	.pipe(gulpif(!config.dev, csso()))
	.pipe(gulp.dest(config.styles.dest))
	.pipe(gulpif(config.dev, reload({ stream: true })));
});




//
// Scripts
//

const webpackConfig = require('./webpack.config')(config);

gulp.task('scripts', (done) => {
  webpack(webpackConfig, (err, stats) => {
	if (err) {
		gutil.log(gutil.colors.red(err()));
	}
	const result = stats.toJson();
	if (result.errors.length) {
		result.errors.forEach((error) => {
			gutil.log(gutil.colors.red(error));
		});
	}
	done();
  });
});




//
// Images
//

gulp.task('images', ['favicon'], () => {
	return gulp.src(config.images.src)
		.pipe(imagemin())
		.pipe(gulp.dest(config.images.dest));
});

gulp.task('favicon', () => {
	return gulp.src('src/favicon.ico')
		.pipe(gulp.dest(config.dest));
});




//
// HTML
//

gulp.task('html', () =>
	gulp.src(config.templates.src)
		.pipe(nunjucks.compile())
		.pipe(gulp.dest(config.dest))
);




//
// Serve
//

gulp.task('serve', () => {

	browserSync({
		server: {
			baseDir: config.dest,
		},
		notify: false,
	});

	gulp.task('html:watch', ['html'], browserSync.reload);
	gulp.watch(config.templates.watch, ['html:watch']);

	gulp.task('styles:watch', ['styles']);
	gulp.watch(config.styles.watch, ['styles:watch']);

	gulp.task('scripts:watch', ['scripts'], browserSync.reload);
	gulp.watch(config.scripts.watch, ['scripts:watch']);

	gulp.task('images:watch', ['images'], browserSync.reload);
	gulp.watch(config.images.watch, ['images:watch']);

});




//
// Default
//

gulp.task('default', ['clean'], () => {

	// define build tasks
	const tasks = [
		'styles',
		'scripts',
		'images',
		'html',
	];

	// run build
	runSequence(tasks, () => {
		if (config.dev) {
			gulp.start('serve');
		}
	});

});
