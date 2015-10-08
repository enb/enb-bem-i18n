var EOL = require('os').EOL,
    enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    keysets = require('../lib/keysets'),
    domjs = require('dom-js');

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
 *     bemTechs = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *    config.node('bundle', function(node) {
 *        // get FileList
 *        node.addTechs([
 *            [FileProvideTech, { target: '?.bemdecl.js' }],
 *            [bemTechs.levels, { levels: ['blocks'] }],
 *            [bemTechs.deps],
 *            [bemTechs.files]
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
module.exports = buildFlow.create()
    .name('keysets-xml')
    .target('target', '?.keysets.{lang}.xml')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
        return this._readKeysetsFile(keysetsFilename).then(function (keysets) {
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
        },
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
