var EOL = require('os').EOL,
    path = require('path'),
    domjs = require('dom-js'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

/**
 * @class KeysetsXMLTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds `?.keysets.{lang}.xml` from `?.keysets.{lang}.js` bundle files.<br/><br/>
 *
 * @param {Object}   options                                        Options.
 * @param {String}   [options.target='?.keysets.{lang}.xml']        Path to a target with compiled file.
 * @param {String}   options.lang                                   Language identifier.
 * @param {String}   [options.keysetsTarget='?.keysets.{lang}.js']  Path to a source keysets file.
 *
 * @example
 * var BemhtmlTech = require('enb-bemhtml/techs/bemhtml'),
 *     FileProvideTech = require('enb/techs/file-provider'),
 *     Keysets = require('enb-bem-i18n/techs/keysets'),
 *     KeysetsXML = require('enb-bem-i18n/techs/keysets-xml'),
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
 *        // make *.xml keysets files
 *        node.addTechs([
 *          [ KeysetsXML, { lang: 'all' } ],
 *          [ KeysetsXML, { lang: '{lang}' } ]
 *        ]);
 *    });
 * };
 */
module.exports = require('enb/lib/build-flow').create()
    .name('keysets-xml')
    .target('target', '?.keysets.{lang}.xml')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
        var node = this.node,
            cache = node.getNodeCache(this._target),
            basename = path.basename(keysetsFilename),
            cacheKey = 'keysets-file-' + basename,
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

        return promise.then(function (keysets) {
            var lang = this._lang,
                res = Object.keys(keysets).sort().reduce(function (prev, keysetName) {
                    var keyset = keysets[keysetName];
                    prev.push('<keyset id="' + keysetName + '">');
                    Object.keys(keyset).forEach(function (key) {
                        var value = keyset[key],
                            dom = new domjs.DomJS();
                        try {
                            dom.parse('<root>' + value + '</root>', function () {});
                        } catch (e) {
                            value = domjs.escape(value);
                        }
                        prev.push('<key id="' + key + '">');
                        prev.push('<value>' + value + '</value>');
                        prev.push('</key>');
                    });
                    prev.push('</keyset>');
                    return prev;
                }, []);

            return this.getPrependXml(lang) + res.join(EOL) + this.getAppendXml(lang);
        }, this);
    })
    .methods({
        getPrependXml: function () {
            return '<?xml version="1.0" encoding="utf-8"?>' + EOL +
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
                'xmlns:i18n="urn:yandex-functions:internationalization">' + EOL;
        },
        getAppendXml: function () {
            return EOL + '</tanker>';
        }
    })
    .createTech();
