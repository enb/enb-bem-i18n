/**
 * i18n-bemjson-to-html
 * ======================
 *
 * Собирает *html*-файл с помощью *bemjson*, *BH* или *BEMHTML*, *lang.all* и *lang.{lang}*.
 *
 * **Опции**
 *
 * * *String* **templateFile** — Исходный файл шаблона. По умолчанию — `?.bh.js`.
 * * *String* **bemjsonFile** — Исходный BEMJSON-файл. По умолчанию — `?.bemjson.js`.
 * * *String* **langAllFile** — Исходный langAll-файл. По умолчанию — `?.lang.all.js`.
 * * *String* **langFile** — Исходный lang-файл. По умолчанию — `?.lang.{lang}.js`.
 *   Если параметр lang не указан, берется первый из объявленных в проекте языков
 * * *String* **target** — Результирующий HTML-файл. По умолчанию — `?.{lang}.html`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bh/techs/i18n-bemjson-to-html'));
 * ```
 */
var vm = require('vm'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    requireOrEval = require('enb/lib/fs/require-or-eval'),
    asyncRequire = require('enb/lib/fs/async-require'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = require('enb/lib/build-flow').create()
    .name('i18n-bemjson-to-html')
    .target('target', '?.{lang}.html')
    .useSourceFilename('templateFile')
    .useSourceFilename('bemjsonFile', '?.bemjson.js')
    .useSourceFilename('langAllFile', '?.lang.all.js')
    .useSourceFilename('langFile', '?.lang.{lang}.js')
    .needRebuild(function (cache) {
        return cache.needRebuildFile('template-file', this.node.resolvePath(this._templateFile)) ||
            cache.needRebuildFile('bemjson-file', this.node.resolvePath(this._bemjsonFile)) ||
            cache.needRebuildFile('allLang-file', this.node.resolvePath(this._langAllFile)) ||
            cache.needRebuildFile('lang-file', this.node.resolvePath(this._langFile)) ||
            cache.needRebuildFile('html-file', this.node.resolvePath(this._target));
    })
    .saveCache(function (cache) {
        cache.cacheFileInfo('template-file', this.node.resolvePath(this._templateFile));
        cache.cacheFileInfo('bemjson-file', this.node.resolvePath(this._bemjsonFile));
        cache.cacheFileInfo('allLang-file', this.node.resolvePath(this._langAllFile));
        cache.cacheFileInfo('lang-file', this.node.resolvePath(this._langFile));
        cache.cacheFileInfo('html-file', this.node.resolvePath(this._target));
    })
    .builder(function (templateFilename, bemjsonFilename, allLangFilename, langFilename) {
        dropRequireCache(require, templateFilename);
        dropRequireCache(require, bemjsonFilename);

        return vow.all([
            asyncRequire(templateFilename),
            requireOrEval(bemjsonFilename),
            vfs.read(allLangFilename),
            vfs.read(langFilename)
        ]).spread(function (template, bemjson, allLangSource, langSource) {
            vm.runInThisContext(allLangSource, allLangFilename);
            vm.runInThisContext(langSource, langFilename);

            template = template.BEMHTML || template;
            return template.apply(bemjson);
        });
    })
    .createTech();
