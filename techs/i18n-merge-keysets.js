/**
 * i18n-merge-keysets
 * ==================
 *
 * Собирает `?.keysets.<язык>.js`-файлы на основе `*.i18n`-папок для указанных языков.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   [ require('enb-bem-i18n/techs/i18n-merge-keysets'), { lang: 'all' } ],
 *   [ require('enb-bem-i18n/techs/i18n-merge-keysets'), { lang: '{lang}' } ]
 * ]);
 * ```
 */
/**
 * keysets
 * =======
 *
 * Собирает `?.keysets.<язык>.js`-файлы на основе `*.i18n`-папок для указанных языков.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([require('enb-bem-core-i18n/techs/keysets'), { lang: '{lang}' }]);
 * ```
 */

var vow = require('vow'),
    serialize = require('serialize-javascript'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = require('enb/lib/build-flow.js').create()
    .name('i18n-merge-keysets')
    .target('target', '?.keysets.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList(['i18n.js'])
    .useDirList(['i18n'])
    .builder(function (i18nFiles, i18nDirs) {
        var node = this.node,
            cache = node.getNodeCache(this._target),
            lang = this._lang,
            langname = lang + '.js',
            result = {},
            files = [].concat(i18nFiles).concat(i18nDirs
                .reduce(function (prev, dir) {
                    return prev.concat(dir.files);
                }, [])
                .filter(function (file) {
                    return [langname, 'all.js'].indexOf(file.name) > -1;
                })
            );

        return vow.all(files.map(function (file) {
            var filename = file.fullname,
                basename = file.name,
                cacheKey = 'keyset-file-' + basename,
                promise;

            if (cache.needRebuildFile(cacheKey, filename)) {
                dropRequireCache(require, filename);
                promise = asyncRequire(filename)
                    .then(function (keysets) {
                        cache.cacheFileInfo(cacheKey, filename);

                        return keysets;
                    });
            } else {
                promise = asyncRequire(filename);
            }

            return promise.then(function (keysets) {
                    Object.keys(keysets).forEach(function (scope) {
                        var keyset = keysets[scope];

                        result[scope] || (result[scope] = {});

                        Object.keys(keyset).forEach(function (name) {
                            result[scope][name] = keyset[name];
                        });
                    });
                });
            }))
            .then(function () {
                return 'module.exports = ' + serialize(result) + ';';
            });
    })
    .createTech();
