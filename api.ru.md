# API технологий

Пакет предоставляет следующие технологии:

* [keysets](#keysets) — служебная технология для сбора исходных файлов с переводами.
* [i18n](#i18n) — технология, которая формирует общий бандл с переводами для каждого языка для дальнейшего использования.
* [keysets-xml](#keysets-xml) — технология для локализации сервисов, использующих XSLT для шаблонизации.

## keysets

Служебная технология. Собирает данные (`keysets`) для указанного языка в `?.keysets.<lang>.js`-файл на основе `<lang>.js`-файлов.

### Опции

* [target](#target)
* [lang](#lang)
* [dirsTarget](#dirstarget)
* [sourceDirSuffixes](#sourcedirsuffixes)

#### target

Тип: `String`. По умолчанию: `?.keysets.<lang>.js`.

Имя файла, куда будет записан результат сборки необходимых `<lang>.js`-файлов проекта — скомпилированный файл `?.keysets.<lang>.js`.

`?.keysets.<lang>.js`-файл — это промежуточный результат сборки, который в дальнейшем используется технологией [i18n](#i18n).

#### lang

Тип: `String`. Обязательная опция.

Язык, для которого необходимо собрать файл.

Допустимые значения:

* **'lang'** — значение языка (например, `'en'`, `'ru'`), для которого будут собраны данные (`keysets`) из файлов `<lang>.js`.

* **'{lang}'** — специальная директива, которая вызывает технологию необходимое количество раз с поочередной подстановкой в `'lang'` всех языков, указанных в параметрах функции `config.setLanguages()`.

#### dirsTarget

Тип: `String`. По умолчанию: `?.i18n`.

Имя таргета, откуда будет доступен список исходных директорий для сборки. Список директорий предоставляет технология [files](https://github.com/enb-bem/enb-bem-techs/blob/master/docs/api.ru.md#files) пакета [enb-bem-techs](https://ru.bem.info/tools/bem/enb-bem-techs/readme/).

#### sourceDirSuffixes

Тип: `String | String[]`. По умолчанию: `['.i18n']`.

Суффиксы директорий, по которым они отбираются для дальнейшей сборки.


-------------------------------------
**Пример**

```js
var KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function(node) {
        // Получаем FileList
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Собираем keyset-файлы для каждого языка
        node.addTech([KeysetsTech, { lang: '{lang}' }]);
        node.addTarget('?.keysets.{lang}.js');
    });
};
```

## i18n

Собирает `?.lang.<lang>.js`-файлы для отдельных языков на основе данных из `?.keysets.<lang>.js`-файлов, полученных в результате использования технологии [keysets](#keysets).

`i18n` — технология сборки, которая транслирует данные из `?.keysets.<lang>.js`-файлов в JavaScript.

Технология `i18n` инициализирует ядро `i18n` данными из объединенных keyset-файлов и возвращает функцию `i18n`, которую можно использовать из [шаблонов](/README.md#в-шаблонах) или [клиентского JavaScript](README.md#В-javascript).

>API функции `i18n` описан в разделе [API `i18n`](README.md#api-i18n).

### Опции

* [target](#target-1)
* [lang](#lang-1)
* [keysetsFile](#keysetsfile)
* [exports](#exports)

#### target

Тип: `String`. По умолчанию: `?.lang.<lang>.js`.

Имя файла, куда будет записан результат сборки необходимых данных из `?.keysets.<lang>.js`-файла — скомпилированный файл `?.lang.<lang>.js`.

#### lang

Тип: `String`. Обязательная опция.

Язык, для которого необходимо собрать финальный файл, содержащий строки переводов.

Допустимые значения:

* **'lang'** — значение языка (например, `'en'`, `'ru'`), для которого будут собраны данные (`keysets`) из файлов `<lang>.js`.

* **'{lang}'** — специальная директива, которая вызывает технологию необходимое количество раз с поочередной подстановкой в `'lang'` всех языков, указанных в параметрах функции `config.setLanguages()`.

#### keysetsFile

Тип: `String`. По умолчанию — `?.keysets.<lang>.js`.

`?.keysets.<lang>.js`-файл — это результат выполнения [keysets](#keysets) — набор данных (`keysets`) для указанного языка, который используется технологией [i18n](#i18n) для формирования `?.lang.<lang>.js`-файлов.

#### exports

Тип: `Object`. По умолчанию — `{ globals: true, commonJS: true, ym: true }`.

Настраивает способ получения функции `i18n`. Возможные опции:

* `globals: true` — функция `i18n` будет доступна из глобальной переменной `BEM.I18N`, если в среде исполнения нет модульных систем. Чтобы глобальная переменная была доступна при наличии модульных систем, нужно указать специальное значение `globals: 'force'`.
* `commonJS: true` — скомпилированный файл можно подключить как CommonJS модуль.
* `ym: true` — функция `i18n` будет доступна из модульной системы [YModules](https://ru.bem.info/tools/bem/modules/).

-------------------------------------
**Пример**

```js
var I18NTech  = require('enb-bem-i18n/techs/i18n'),
    KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function(node) {
        // Получаем FileList
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Собираем keyset-файлы для каждого языка
        node.addTech([KeysetsTech, { lang: '{lang}' }]);

        // Собираем i18n-файлы для каждого языка
        node.addTech([I18NTech, { lang: '{lang}' }]);
        node.addTarget('?.lang.{lang}.js');
    });
};
```

## keysets-xml

Собирает `?.keysets.<lang>.xml`-файлы на основе `?.keysets.<lang>.js`-файлов.

Технология `keysets-xml` применяется для локализации сервисов, использующих [XSLT](https://github.com/veged/xjst) для шаблонизации.
Используется для локализации XML-страниц.

### Опции

* [target](#target-2)
* [lang](#lang-2)

#### target

Тип: `String`. По умолчанию — `?.keysets.{lang}.js`.

Результирующий XML-файл.

#### lang

Тип: `String`. Обязательная опция.

Язык, для которого небходимо собрать файл.

-----------------------------
**Пример**

```js
var KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    KeysetsXMLTech = require('enb-bem-i18n/techs/keysets-xml'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function(node) {
        // Получаем FileList
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Собираем keyset-файлы для каждого языка
        node.addTech([KeysetsTech, { lang: '{lang}' }]);

        // Собираем XML-файлы для каждого языка
        node.addTech([KeysetsXMLTech, { lang: '{lang}' }]);
        node.addTarget('?.keysets.{lang}.js');
    });
};
```
