var EOL = require('os').EOL,
    vow = require('vow'),
    path = require('path'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    keysets = require('../lib/keysets'),
    compile = require('../lib/compile');

/**
 * @class BHCommonJSI18nTech
 * @augments {BHCommonJSTech}
 * @classdesc
 *
 * Compiles localized CommonJS module of BH with requires of core and source templates (`bh.js` files).<br/><br/>
 *
 * Localization is based on pre-built `?.keysets.{lang}.js` bundle files.<br/><br/>
 *
 * Use on server side only (Node.js). You can use `require` in templates.<br/><br/>
 *
 * Important: for correct apply the source files and files are specified in `requires` should be in file system.
 *
 * @param {Object}      options                                        Options.
 * @param {String}      [options.target='?.bh.{lang}.js']              Path to a target with compiled file.
 * @param {String}      options.lang                                   Language identifier.
 * @param {String}      [options.filesTarget='?.files']                Path to target with FileList.
 * @param {String[]}    [options.sourceSuffixes='bh.js']               Files with specified suffixes involved in the
 *                                                                     assembly.
 * @param {String[]}    [options.mimic]                                Names to export.
 * @param {Boolean}     [options.devMode=true]                         Drops cache for `require` of source templates.
 * @param {String}      [options.jsAttrName='data-bem']                Sets `jsAttrName` option for BH core.
 * @param {String}      [options.jsAttrScheme='json']                  Sets `jsAttrScheme` option for BH core.
 * @param {String}      [options.jsCls='i-bem']                        Sets `jsCls` option for BH core.
 * @param {Boolean}     [options.jsElem=true]                          Sets `jsElem` option for BH core.
 * @param {Boolean}     [options.escapeContent=false]                  Sets `escapeContent` option for BH core.
 * @param {Boolean}     [options.clsNobaseMods=false]                  Sets `clsNobaseMods` option for BH core.
 * @param {String}      [options.keysetsFie='?.keysets.{lang}.js']     Path to a source keysets file.
 *
 * @example
 * var BHCommonJSI18nTech = require('enb-bem-i18n/techs/bh-commonjs-i18n'),
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
 *         // build localized BH file for given {lang}
 *         node.addTech([ BHCommonJSI18nTech, { lang: '{lang}' } ]);
 *         node.addTarget('?.bh.{lang}.js');
 *     });
 * };
 */
module.exports = require('enb-bh/techs/bh-commonjs').buildFlow()
    .name('bh-commonjs-i18n')
    .target('target', '?.bh.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['bh.js'])
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (templateFiles, keysetsFilename) {
        var cache = this.node.getNodeCache(this._target),
            cacheKey = 'keysets-file-' + path.basename(keysetsFilename),
            promises = [].concat(this._compile(templateFiles));

        if (cache.needRebuildFile(cacheKey, keysetsFilename)) {
            dropRequireCache(require, keysetsFilename);
            promises.push(asyncRequire(keysetsFilename)
                .then(function (keysets) {
                    cache.cacheFileInfo(cacheKey, keysetsFilename);

                    return keysets;
                }));
        } else {
            promises.push(asyncRequire(keysetsFilename));
        }

        return vow.all(promises)
            .spread(function (bh, sources) {
                var parsed = keysets.parse(sources);

                return [
                    bh,
                    'module.exports.lib.i18n = ' + compile(parsed, this._lang) + ';'
                ].join(EOL);
            });
    })
    .createTech();
