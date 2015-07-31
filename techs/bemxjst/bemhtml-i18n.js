var EOL = require('os').EOL,
    path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    bemcompat = require('bemhtml-compat'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    keysets = require('../../lib/keysets'),
    compile = require('../../lib/compile'),
    XJST_SUFFIX = 'xjst';

/**
 * @class BemhtmlI18nTech
 * @augments {BemhtmlTech}
 * @classdesc
 *
 * Compiles localized BEMHTML template files with BEMXJST translator and merges them into a single BEMHTML bundle.<br/>
 * <br/>
 * Localization is based on pre-built `?.keysets.{lang}.js` bundle files.<br/><br/>
 *
 * Important: It supports only JavaScript syntax by default. Use `compat` option to support old BEMHTML syntax.
 *
 * @param {Object}    [options]                                    Options
 * @param {String}    [options.target='?.bemhtml.{lang}.js']       Path to a target with compiled file.
 * @param {String}    options.lang                                 Language identifier.
 * @param {String}    [options.exportName='BEMHTML']               Name of BEMHTML template variable.
 * @param {Boolean}   [options.compat=false]                       Sets `compat` option to support old BEMHTML syntax.
 * @param {Boolean}   [options.devMode=true]                       Sets `devMode` option for convenient debugging.
 *                                                                 If `devMode` is set to true, code of templates will
 *                                                                 not be compiled but only wrapped for development
 *                                                                 purposes.
 * @param {Boolean}   [options.cache=false]                        Sets `cache` option for cache usage.
 * @param {Object}    [options.requires]                           Names of dependencies which should be available from
 *                                                                 code of templates.
 * @param {String[]}  [options.sourceSuffixes]                     Files with specified suffixes involved in the
 *                                                                 assembly.
 * @param {String}    [options.keysetsFile='?.keysets.{lang}.js']  Path to a source keysets file.
 *
 * @example
 * var BemhtmlI18nTech = require('enb-bem-i18n/techs/bemxjst/bemhtml-i18n'),
 *     FileProvideTech = require('enb/techs/file-provider'),
 *     bem = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get FileList
 *         node.addTechs([
 *             [FileProvideTech, { target: '?.bemdecl.js' }],
 *             [bem.levels, levels: ['blocks']],
 *             bem.deps,
 *             bem.files
 *         ]);
 *
 *         // collect and merge keysets files into bundle
 *         node.addTechs([
 *            [ Keysets, { lang: '{lang}' } ]
 *         ]);
 *
 *         // build localized BEMHTML file for given {lang}
 *         node.addTech([ BemhtmlI18nTech, { lang: '{lang}' } ]);
 *         node.addTarget('?.bemhtml.{lang}.js');
 *     });
 * };
 */
module.exports = require('enb-bemxjst/techs/bemhtml').buildFlow()
    .name('bemhtml-i18n')
    .target('target', '?.bemhtml.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['bemhtml', 'bemhtml.xjst'])
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (sourceFiles, keysetsFilename) {
        var cache = this.node.getNodeCache(this._target),
            cacheKey = 'keysets-file-' + path.basename(keysetsFilename),
            promise;

        if (cache.needRebuildFile(cacheKey, keysetsFilename)) {
            dropRequireCache(require, keysetsFilename);
            promise = asyncRequire(keysetsFilename)
                .then(function (keysets) {
                    cache.cacheFileInfo(cacheKey, keysetsFilename);

                    return keysets;
                });
        } else {
            promise = asyncRequire(keysetsFilename);
        }

        return promise
            .then(function (sources) {
                var parsed = keysets.parse(sources),
                    template = [
                        'oninit(function(exports, context) {',
                        '    context.BEMContext.prototype.i18n = ' + compile(parsed, this._lang) + ';',
                        '});'
                    ].join(EOL);

                return this._readSourceFiles(sourceFiles, true)
                    .then(function (sources) {
                        var source = sources.join(EOL) + template;
                        return this._bemxjstProcess(source);
                    }, this);
            }, this);
    })
    .methods({
        _readSourceFiles: function (sourceFiles, oldSyntax) {
            return vow.all(sourceFiles.map(function (file) {
                return vfs.read(file.fullname, 'utf8')
                    .then(function (source) {
                        if (oldSyntax && XJST_SUFFIX !== file.suffix.split('.').pop()) {
                            source = bemcompat.transpile(source);
                        }

                        return '/* begin: ' + file.fullname + ' */' + EOL +
                            source +
                            EOL + '/* end: ' + file.fullname + ' *' + '/';
                    });
            }));
        }
    })
    .createTech();
