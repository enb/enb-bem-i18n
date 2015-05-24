/**
 * i18n-keysets-xml
 * ================
 *
 * Собирает `?.keysets.<язык>.xml`-файлы на основе `?.keysets.<язык>.js`-файлов.
 *
 * Используется для локализации xml-страниц.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('i18n-keysets-xml'), { lang: '{lang}' } ]);
 * ```
 */
var path = require('path'),
    domjs = require('dom-js'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = require('enb/lib/build-flow').create()
    .name('i18n-keysets-xml')
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

            return this.getPrependXml(lang) + res.join('\n') + this.getAppendXml(lang);
        }, this);
    })
    .methods({
        getPrependXml: function () {
            return '<?xml version="1.0" encoding="utf-8"?>\n' +
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
                'xmlns:i18n="urn:yandex-functions:internationalization">\n';
        },
        getAppendXml: function () {
            return '\n</tanker>';
        }
    })
    .createTech();
