/**
 * i18n-lang-js
 * ============
 *
 * Собирает `?.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файлов.
 *
 * Используется для локализации в JS с помощью BEM.I18N.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.lang.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   [ require('enb-bem-i18n/techs/i18n-lang-js'), { lang: 'all'} ],
 *   [ require('enb-bem-i18n/techs/i18n-lang-js'), { lang: '{lang}'} ],
 * ]);
 * ```
 */
/**
 * i18n
 * ====
 *
 * Собирает `?.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файла.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.lang.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 * * *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([require('enb-bem-core-i18n/techs/i18n'), { lang: '{lang}' }]);
 * ```
 */
var EOL = require('os').EOL,
    path = require('path'),
    tanker = require('../exlib/tanker'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    keysets = require('../lib/keysets'),
    compile = require('../lib/compile');

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
                var parsed = keysets.parse(sources),
                    f = parsed.isDeprecated ?
                        this.buildOldi18nLangStructure :
                        this.buildNewi18nLangStructure;

                return f.call(this, parsed);
            }, this);
    })
    .methods({
        buildNewi18nLangStructure: function (parsed) {
            return [
                '(function () {',
                '    var __i18n__ = ' + compile(parsed.core, parsed.keysets) + ',',
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
                '})();'
            ].join(EOL);
        },
        buildOldi18nLangStructure: function (parsed) {
            var __self = this.__self,
                lang = this._lang,
                res = Object.keys(parsed.keysets).sort().reduce(function (prev, keysetName) {
                    prev.push(__self.getKeysetBuildResult(keysetName, parsed.keysets[keysetName], lang));
                    return prev;
                }.bind(this), []);

            res = __self.getPrependJs() + res.join(EOL + EOL) + __self.getAppendJs(lang);

            if (parsed.core) {
                res = parsed.core + EOL + EOL + res;
            }

            return res;
        }
    })
    .staticMethods({
        getPrependJs: function () {
            return 'if (typeof BEM !== \'undefined\' && BEM.I18N) {';
        },
        getAppendJs: function (lang) {
            return [ '', '', 'BEM.I18N.lang(\'' + lang + '\');', '', '}', '' ].join(EOL);
        },
        getKeysetBuildResult: function (keysetName, keyset, lang) {
            var res = [];
            res.push('BEM.I18N.decl(\'' + keysetName + '\', {');
            Object.keys(keyset).map(function (key, i, arr) {
                tanker.xmlToJs(keyset[key], function (js) {
                    res.push('    ' + JSON.stringify(key) + ': ' + js + (i === arr.length - 1 ? '' : ','));
                });
            });
            res.push('}, {' + EOL + '"lang": "' + lang + '"' + EOL + '});');
            return res.join(EOL);
        }
    })
    .createTech();
