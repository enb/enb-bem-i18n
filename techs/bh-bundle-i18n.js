var vow = require('vow'),
    path = require('path'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    keysets = require('../lib/keysets'),
    compile = require('../lib/compile');

/**
 * @class BHBundleI18nTech
 * @augments {BHBundleTech}
 * @classdesc
 *
 * Builds localized file with CommonJS requires for core and each BH template (`bh.js` files).<br/><br/>
 *
 * Localization is based on pre-built `?.keysets.{lang}.js` bundle files.<br/><br/>
 *
 * Use in browsers and on server side (Node.js).<br/><br/>
 *
 * The compiled BH module supports CommonJS and YModules. If there is no any modular system in the runtime,
 * the module will be provided as global variable `BH`.<br/><br/>
 *
 * Important: do not use `require` in templates.
 *
 * @param {Object}      options                                        Options.
 * @param {String}      [options.target='?.bh.{lang}.js']              Path to a target with compiled file.
 * @param {String}      options.lang                                   Language identifier.
 * @param {String}      [options.filesTarget='?.files']                Path to target with FileList.
 * @param {String[]}    [options.sourceSuffixes='bh.js']               Files with specified suffixes involved
 *                                                                     in the assembly.
 * @param {Object}      [options.requires]                             Names for dependencies to `BH.lib.name`.
 * @param {String[]}    [options.mimic]                                Names for export.
 * @param {String}      [options.scope='template']                     Scope of templates execution.
 * @param {Boolean}     [options.sourcemap=false]                      Includes inline source maps.
 * @param {String}      [options.jsAttrName='data-bem']                Sets `jsAttrName` option for BH core.
 * @param {String}      [options.jsAttrScheme='json']                  Sets `jsAttrScheme` option for BH core.
 * @param {String}      [options.jsCls='i-bem']                        Sets `jsCls` option for BH core.
 * @param {Boolean}     [options.jsElem=true]                          Sets `jsElem` option for BH core.
 * @param {Boolean}     [options.escapeContent=false]                  Sets `escapeContent` option for BH core.
 * @param {Boolean}     [options.clsNobaseMods=false]                  Sets `clsNobaseMods` option for BH core.
 * @param {String}      [options.keysetsFile='?.keysets.{lang}.js']    Path to a source keysets file.
 *
 * @example
 * var BHBundleI18nTech = require('enb-bh/techs/bh-bundle'),
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
 *         node.addTech([ BHBundleI18nTech, { lang: '{lang}' } ]);
 *         node.addTarget('?.bh.{lang}.js');
 *     });
 * };
 */
module.exports = require('enb-bh/techs/bh-bundle').buildFlow()
    .name('bh-bundle-i18n')
    .target('target', '?.bh.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['bh.js'])
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (templateFiles, keysetsFilename) {
        var cache = this.node.getNodeCache(this._target),
            cacheKey = 'keysets-file-' + path.basename(keysetsFilename),
            promises = [this._compileBH(templateFiles)];

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
                    '(function () {',
                    '    var __i18n__ = ' + compile(parsed, this._lang) + ',',
                    '        defineAsGlobal = true;',
                    '',
                    '    // CommonJS',
                    '    if (typeof exports === "object") {',
                    '        module.exports.lib.i18n = __i18n__;',
                    '        defineAsGlobal = false;',
                    '    }',
                    '',
                    '    // YModules',
                    '    if (typeof modules === "object") {',
                    '        modules.define("BH", function (provide, bh) {',
                    '            bh.lib.i18n = __i18n__',
                    '            provide(bh);',
                    '        });',
                    '        defineAsGlobal = false;',
                    '    }',
                    '',
                    '    if (defineAsGlobal) {',
                    '        global.BH.lib.i18n = __i18n__;',
                    '    }',
                    '})();'
                ].join('\n');
            });
    })
    .methods({
        _compileBH: function (files) {
            return this._readTemplates(files)
                .then(this._compile.bind(this));
        }
    })
    .createTech();
