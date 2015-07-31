var EOL = require('os').EOL,
    path = require('path'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    SourceMap = require('enb-xjst/lib/source-map'),
    keysets = require('../../lib/keysets'),
    compile = require('../../lib/compile');

/**
 * @class BemhtmlI18nTech
 * @augments {BemhtmlTech}
 * @classdesc
 *
 * Compiles localized BEMHTML template files with XJST translator and merges them into a single BEMHTML bundle.<br/>
 * <br/>
 * Localization is based on pre-built `?.keysets.{lang}.js` bundle files.<br/><br/>
 *
 * @param {Object}    options                                      Options.
 * @param {String}    [options.target='?.bemhtml.{lang}.js']       Path to a target with compiled file.
 * @param {String}    options.lang                                 Language identifier.
 * @param {String}    [options.filesTarget='?.files']              Path to target with FileList.
 * @param {String}    [options.exportName='BEMHTML']               Name of BEMHTML template variable.
 * @param {String}    [options.applyFuncName='apply']              Alias  for `apply` function of base BEMHTML template.
 * @param {Boolean}   [options.devMode=true]                       Sets `devMode` option for convenient debugging.
 *                                                                 If `devMode` is set to true, code of templates
 *                                                                 will not be compiled but only wrapped for development
 *                                                                 purposes.
 * @param {Boolean}   [options.cache=false]                        Sets `cache` option for cache usage.
 * @param {Object}    [options.requires]                           Names of dependencies which should be available from
 *                                                                 code of templates.
 * @param {String[]}  [options.sourceSuffixes]                     Files with specified suffixes involved in the
 *                                                                 assembly.
 * @param {String}    [options.keysetsFile='?.keysets.{lang}.js']  Path to a source keysets file.
 *
 * @example
 * var BemhtmlI18nTech = require('enb-bem-i18n/techs/xjst/bemhtml-i18n'),
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
 *         // collect and merge keysets files into a bundle
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
module.exports = require('enb-xjst/techs/bemhtml').buildFlow()
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
                    i18nWrapperCode = [
                        'if(typeof BEM == "undefined") { var BEM = {}; }',
                        '(function(bem_) {',
                        '    bem_.I18N = ' + compile(parsed, this._lang) + ';',
                        '}(BEM));'
                    ].join(EOL);

                if (parsed.version === 2) {
                    throw new Error('XJST templates can not be used with bem-core i18n system');
                }

                return this._readSourceFiles(sourceFiles)
                    .then(function (sources) {
                        var sourceMap = SourceMap(sources),
                            code = sourceMap.getCode();

                        return this._xjstProcess(code, sourceMap).then(function (res) {
                            return i18nWrapperCode + res;
                        });
                    }, this);
            }, this);
    })
    .createTech();

