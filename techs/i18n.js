var EOL = require('os').EOL,
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
 * @param {String}   [options.exports={
 *      globals: true, commonJS: true, ym: true}]                   Export settings.
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
    .defineOption('exports', {
        globals: true,
        commonJS: true,
        ym: true
    })
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
        return this._readKeysetsFile(keysetsFilename)
            .then(function (sources) {
                var parsed = keysets.parse(sources),
                    opts = {
                        version: parsed.version,
                        language: this._lang,
                        exports: this._exports
                    },
                    globals = opts.exports.globals,
                    forceGlobals = globals === 'force';

                return [].concat(
                    [
                        forceGlobals ? 'var BEM;' : '',
                        '(function (global) {',
                        '    var __i18n__ = ' + compile(parsed.core, parsed.keysets, opts) + ',',
                        '        defineAsGlobal = true;',
                        ''
                    ],
                    opts.exports.commonJS ? [
                        '    // CommonJS',
                        '    if (typeof exports === "object") {',
                        '        module.exports = __i18n__;',
                        forceGlobals ?
                        '        defineAsGlobal = false;' : '',
                        '    }',
                        ''
                    ] : '',
                    opts.exports.ym ? [
                        '    // YModules',
                        '    if (typeof modules === "object") {',
                        '        modules.define("i18n", function (provide) {',
                        '            provide(__i18n__);',
                        '        });',
                        forceGlobals ?
                        '        defineAsGlobal = false;' : '',
                        '    }',
                        '',
                    ] : '',
                    globals ? [
                        '    if (defineAsGlobal) {',
                        forceGlobals ?
                        '        (BEM || (BEM = {})).I18N = __i18n__;' : '',
                        '        (global.BEM || (global.BEM = {})).I18N = __i18n__;',
                        '    }'
                    ] : '',
                    '})(this);'
                ).join(EOL);
            }, this);
    })
    .methods({
        /**
         * Reads file with keysets.
         *
         * @param {String} filename — path to file with keysets.
         * @returns {Promise}
         * @private
         */
        _readKeysetsFile: function (filename) {
            var node = this.node,
                root = node.getRootDir(),
                cache = node.getNodeCache(this._target);

            return keysets.read(filename, cache, root);
        }
    })
    .createTech();
