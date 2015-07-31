var EOL = require('os').EOL,
    path = require('path'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    keysets = require('../lib/keysets'),
    compile = require('../lib/compile');

/**
 * @class I18nTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds `?.lang.{lang}.js` from `?.keysets.{lang}.js` bundle files.<br/><br/>
 *
 * @param {Object}   options                                        Options.
 * @param {String}   [options.target='?.lang.{lang}.js']            Path to a target with compiled file.
 * @param {String}   options.lang                                   Language identifier.
 * @param {String}   [options.keysetsFile='?.keysets.{lang}.js']    Path to a source keysets file.
 *
 * @example
 * var BemhtmlTech = require('enb-bemhtml/techs/bemhtml'),
 *     FileProvideTech = require('enb/techs/file-provider'),
 *     Keysets = require('enb-bem-i18n/techs/keysets'),
 *     I18n = require('enb-bem-i18n/techs/i18n-js'),
 *     bem = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *    config.node('bundle', function(node) {
 *        // get BEMJSON file
 *        node.addTech([FileProvideTech, { target: '?.bemjson.js' }]);
 *
 *        // get FileList
 *        node.addTechs([
 *            [bem.levels, levels: ['blocks']],
 *            bem.bemjsonToBemdecl,
 *            bem.deps,
 *            bem.files
 *        ]);
 *
 *        // collect and merge keysets files into bundle
 *        node.addTechs([
 *          [ Keysets, { lang: 'all' } ],
 *          [ Keysets, { lang: '{lang}' } ]
 *        ]);
 *
 *        // make lang.{lang}.js bundle files from keysets bundle files
 *        node.addTechs([
 *          [ I18n, { lang: 'all' } ],
 *          [ I18n, { lang: '{lang}' } ]
 *        ]);
 *    });
 * };
 */
module.exports = require('enb/lib/build-flow').create()
    .name('i18n')
    .target('target', '?.lang.{lang}.js')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
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
                var parsed = keysets.parse(sources);
                return [
                    '(function (global) {',
                    '    var __i18n__ = ' + compile(parsed, this._lang) + ',',
                    '        defineAsGlobal = true;',
                    '',
                    '    // CommonJS',
                    '    if (typeof exports === "object") {',
                    '        module.exports = __i18n__;',
                    '        defineAsGlobal = false;',
                    '    }',
                    '',
                    '    // YModules',
                    '    if (typeof modules === "object") {',
                    '        modules.define("i18n", function (provide) {',
                    '            provide(__i18n__);',
                    '        });',
                    '        defineAsGlobal = false;',
                    '    }',
                    '',
                    '    if (defineAsGlobal) {',
                    '        global.BEM || (global.BEM = {});',
                    '        global.BEM.I18N = __i18n__;',
                    '    }',
                    '})(this);'
                ].join(EOL);
            }, this);
    })
    .createTech();
