var vow = require('vow'),
    serialize = require('serialize-javascript'),
    keysets = require('../lib/keysets');

/**
 * @class KeysetsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Collects and merges `?.keysets.{lang}.js` files based on files from `*.i18n` folders for given languages.<br/><br/>
 *
 * @param {Object}   options                                   Options.
 * @param {String}   [options.target='?.keysets.{lang}.js']    Path to a target with compiled file.
 * @param {String}   options.lang                              Language identifier.
 *
 * @example
 * var BemhtmlTech = require('enb-bemhtml/techs/bemhtml'),
 *     FileProvideTech = require('enb/techs/file-provider'),
 *     Keysets = require('enb-bem-i18n/techs/keysets'),
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
 *    });
 * };
 */
module.exports = require('enb/lib/build-flow.js').create()
    .name('keysets')
    .target('target', '?.keysets.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['i18n.js'])
    .useDirList(['i18n'])
    .builder(function (i18nFiles, i18nDirs) {
        var lang = this._lang,
            langname = lang + '.js',
            result = {},
            files = [].concat(i18nFiles).concat(i18nDirs
                    .reduce(function (prev, dir) {
                        return prev.concat(dir.files);
                    }, [])
                    .filter(function (file) {
                        return [langname, 'all.js'].indexOf(file.name) > -1;
                    })
                    .sort(function (file1, file2) {
                        if (file1.name === 'all.js') {
                            return -1;
                        }
                        if (file2.name === 'all.js') {
                            return 1;
                        }
                        return 0;
                    })
            );

        return vow.all(files.map(function (file) {
            return this._readKeysetsFile(file.fullname)
                .then(function (keysets) {
                        Object.keys(keysets).forEach(function (scope) {
                            var keyset = keysets[scope];

                            result[scope] || (result[scope] = {});
                            Object.keys(keyset).forEach(function (name) {
                                result[scope][name] = keyset[name];
                            });
                        });
                    });
                }, this))
                .then(function () {
                    return 'module.exports = ' + serialize(result) + ';';
                });
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
