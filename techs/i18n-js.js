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
                var parsed = keysets.parse(sources);
                return [
                    '(function () {',
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
                    '})();'
                ].join(EOL);
            }, this);
    })
    .createTech();
