/**
 * bh-commonjs-i18n
 * ==============
 *
 * Собирает *BH*-файлы по deps'ам в виде `?.bh.js` бандла на основе `?.keysets.<язык>.js`-файла.
 *
 * Предназначен для сборки как клиентского, так и серверного BH-кода.
 * Предполагается, что в *BH*-файлах не используется `require`.
 *
 * Поддерживает CommonJS и YModules. Если в исполняемой среде нет ни одной модульной системы, то модуль будет
 * предоставлен в глобальную переменную `bh`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.bh.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 * * *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`.
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — ['bh.js'].
 * * *Boolean* **sourcemap** — строить карты кода.
 * * *String|Array* **mimic** — имена переменных/модулей для экспорта.
 * * *String* **jsAttrName** — атрибут блока с параметрами инициализации. По умолчанию — `data-bem`.
 * * *String* **jsAttrScheme** — Cхема данных для параметров инициализации. По умолчанию — `json`.
 * *                             Форматы:
 * *                                `js` — Получаем `return { ... }`.
 * *                                `json` — JSON-формат. Получаем `{ ... }`.
 *
 * * *String|Boolean* **jsCls** — имя `i-bem` CSS-класса. По умолчанию - `i-bem`. Для того, чтобы класс
 *    не добавлялся, следует указать значение `false` или пустую строку.
 *
 * * *Boolean* **escapeContent** — экранирование содержимого. По умолчанию - `false`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([require('enb-bem-i18n/techs/bh-commonjs-i18n', { lang: {lang} }]));
 * ```
 */

var EOL = require('os').EOL,
    vow = require('vow'),
    path = require('path'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    keysets = require('../lib/keysets'),
    compile = require('../lib/compile');

module.exports = require('enb-bh/techs/bh-commonjs').buildFlow()
    .name('bh-commonjs-i18n')
    .target('target', '?.bh.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['bh.js'])
    .useSourceFilename('keysetsFile', '?.keysets.{lang}.js')
    .builder(function (templateFiles, keysetsFilename) {
        var cache = this.node.getNodeCache(this._target),
            cacheKey = 'keysets-file-' + path.basename(keysetsFilename),
            promises = [].concat(this._compile(templateFiles));

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
                    'module.exports.lib.i18n = ' + compile(parsed, this._lang) + ';'
                ].join(EOL);
            });
    })
    .createTech();
