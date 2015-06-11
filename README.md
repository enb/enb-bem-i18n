enb-bem-i18n
============


[![NPM version](http://img.shields.io/npm/v/enb-bem-i18n.svg?style=flat)](https://www.npmjs.org/package/enb-bem-i18n)
[![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-i18n/master.svg?style=flat&label=tests)](https://travis-ci.org/enb-bem/enb-bem-i18n)
[![Build status](https://img.shields.io/appveyor/ci/blond/enb-bh.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-bh)
[![Coverage Status](https://img.shields.io/coveralls/enb-bem/enb-bem-i18n.svg?style=flat)](https://coveralls.io/r/enb-bem/enb-bem-i18n?branch=master)
[![devDependency Status](http://img.shields.io/david/enb-bem/enb-bem-i18n.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-i18n)

Поддержка `BEM.I18N` для ENB.

Установка:
----------

```
npm install --save-dev enb-bem-i18n
```

Для работы модуля требуется зависимость от пакета `enb` версии `0.11.0` или выше.

Технологии
----------

* [i18n-js](#i18n-js)
* [keysets](#keysets)
* [i18n-keysets-xml](#i18n-keysets-xml)
* [i18n-bemjson-to-html](#i18n-bemjson-to-html)
* [bh-bundle-i18n](#bh-bundle-i18n)
* [bemhtml-i18n](#bemhtml-i18n)

### i18n-js

Собирает `?.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файлов.

Используется для локализации в JS с помощью BEM.I18N.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.lang.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.
* *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb-bem-i18n/techs/i18n-js'), { lang: 'all'} ],
  [ require('enb-bem-i18n/techs/i18n-js'), { lang: '{lang}'} ]
]);
```

### keysets

Собирает `?.keysets.<язык>.js`-файлы на основе `*.i18n`-папок для указанных языков.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb-bem-i18n/techs/keysets'), { lang: '{lang}' } ]
]);
```

### i18n-keysets-xml

Собирает `?.keysets.<язык>.xml`-файлы на основе `?.keysets.<язык>.js`-файлов.

Используется для локализации xml-страниц.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTech([ require('i18n-keysets-xml'), { lang: '{lang}' } ]);
```

### i18n-bemjson-to-html

Собирает *html*-файл с помощью *bemjson*, *BH* или *BEMHTML*, *lang.all* и *lang.{lang}*.

**Опции**

* *String* **templateFile** — Исходный файл шаблона. Обязательный параметр.
* *String* **bemjsonFile** — Исходный BEMJSON-файл. По умолчанию — `?.bemjson.js`.
* *String* **langAllFile** — Исходный langAll-файл. По умолчанию — `?.lang.all.js`.
* *String* **langFile** — Исходный lang-файл. По умолчанию — `?.lang.{lang}.js`. Если параметр lang не указан, берется первый из объявленных в проекте языков
* *String* **target** — Результирующий HTML-файл. По умолчанию — `?.{lang}.html`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bh/techs/i18n-bemjson-to-html'));
```

### bh-bundle-i18n

Собирает *BH*-файлы по deps'ам в виде `?.bh.js` бандла на основе `?.keysets.<язык>.js`-файла.

Предназначен для сборки как клиентского, так и серверного BH-кода. Предполагается, что в *BH*-файлах не используется `require`.

Поддерживает CommonJS и YModules. Если в исполняемой среде нет ни одной модульной системы, то модуль будет предоставлен в глобальную переменную `bh`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.bh.js`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
* *String* **lang** — Язык, для которого небходимо собрать файл.
* *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`. (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — ['bh.js'].
* *Boolean* **sourcemap** — строить карты кода.
* *String|Array* **mimic** — имена переменных/модулей для экспорта.
* *String* **jsAttrName** — атрибут блока с параметрами инициализации. По умолчанию — `data-bem`.
* *String* **jsAttrScheme** — Cхема данных для параметров инициализации. По умолчанию — `json`. Форматы: `js` — Получаем `return { ... }`. `json` — JSON-формат. Получаем `{ ... }`.
* *String|Boolean* **jsCls** — имя `i-bem` CSS-класса. По умолчанию - `i-bem`. Для того, чтобы класс не добавлялся, следует указать значение `false` или пустую строку.
* *Boolean* **escapeContent** — экранирование содержимого. По умолчанию - `false`.

**Пример**
```javascript
nodeConfig.addTech(require('enb-bem-core-i18n/techs/bh-bundle-i18n'));
```

### bemhtml-i18n

Собирает `?.bemhtml.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файла и исходных шаблонов.

Склеивает *bemhtml.xjst* и *bemhtml*-файлы по deps'ам, обрабатывает `bem-xjst`-транслятором,  сохраняет (по умолчанию) в виде `?.bemhtml.js`.

**Внимание:** поддерживает только js-синтаксис.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.bemhtml.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.
* *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`.
* *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
* *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — `['bemhtml', 'bemhtml.xjst']`.
* *String* **exportName** — Имя переменной-обработчика BEMHTML. По умолчанию — `'BEMHTML'`.
* *Boolean* **devMode** — Development-режим. По умолчанию — true.
* *Boolean* **cache** — Кэширование. Возможно только в production-режиме. По умолчанию — `false`.
* *Object* **modulesDeps** — Хэш-объект, прокидывающий в генерируемую для скомпилированных шаблонов обвязку, необходимые YModules-модули.

**Пример**

```javascript
nodeConfig.addTech([ require('enb-bem-core-i18n/techs/bemhtml-i18n'), { lang: {lang}, devMode: false } ]);
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
