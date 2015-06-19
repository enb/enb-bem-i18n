/**
 * bemhtml-i18n
 * ============
 *
 * Собирает `?.bemhtml.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файла и исходных шаблонов.
 *
 * Склеивает *bemhtml.xjst* и *bemhtml*-файлы по deps'ам, обрабатывает `xjst`-транслятором,
 * сохраняет (по умолчанию) в виде `?.bemhtml.js`.
 * **Внимание:** поддерживает только js-синтаксис.
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.bemhtml.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 * * *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — `['bemhtml', 'bemhtml.xjst']`.
 * * *String* **exportName** — Имя переменной-обработчика BEMHTML. По умолчанию — `'BEMHTML'`.
 * * *Boolean* **devMode** — Development-режим. По умолчанию — true.
 * * *Boolean* **cache** — Кэширование. Возможно только в production-режиме. По умолчанию — `false`.
 * * *Object* **modulesDeps** — Хэш-объект, прокидывающий в генерируемую для скомпилированных шаблонов обвязку,
 *    необходимые YModules-модули.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb-bem-i18n/techs/xjst/bemhtml-i18n'), { lang: {lang}, devMode: false } ]);
 * ```
 */
var EOL = require('os').EOL,
    path = require('path'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    SourceMap = require('enb-xjst/lib/source-map'),
    keysets = require('../../lib/keysets'),
    compile = require('../../lib/compile');

module.exports = require('enb-xjst/techs/bemhtml').buildFlow()
    .name('bemhtml-i18n')
    .target('target', '?.bemhtml.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['bemhtml', 'bemhtml.xjst'])
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (sourceFiles, keysetsFilename) {
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
                    template = [
                         'if(typeof BEM == "undefined") { var BEM = {}; }',
                         '(function(global, bem_) {',
                         '    if(bem_.I18N) {',
                         '        return;',
                         '    }',
                         '    /** @global points to global context */',
                         '    global.BEM = bem_;',
                         '    bem_.I18N = ' + compile(parsed, this._lang) + ';',
                         '})(this, typeof BEM === "undefined" ? {} : BEM);'
                    ].join(EOL);

                return this._readSourceFiles(sourceFiles)
                    .then(function (sources) {
                        var sourceMap = SourceMap(sources),
                            code = sourceMap.getCode();

                        return this._xjstProcess(code, sourceMap).then(function (res) {
                            res = template + res;
                            return res;
                        });
                    }, this);
            }, this);
    })
    .createTech();

