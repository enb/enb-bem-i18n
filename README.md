enb-bem-i18n
============

[![NPM version](http://img.shields.io/npm/v/enb-bem-i18n.svg?style=flat)](https://www.npmjs.org/package/enb-bem-i18n)
[![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-i18n/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem-i18n)
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

* [i18n-merge-keysets](#i18n-merge-keysets)
* [i18n-lang-js](#i18n-lang-js)
* [i18n-keysets-xml](#i18n-keysets-xml)

### i18n-merge-keysets

Собирает `?.keysets.<язык>.js`-файлы на основе `*.i18n`-папок для указанных языков.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb-bem-i18n/techs/i18n-merge-keysets'), { lang: 'all' } ],
  [ require('enb-bem-i18n/techs/i18n-merge-keysets'), { lang: '{lang}' } ]
]);
```

Допустим, что в проекте на уровне переопределения `common` находятся 2 блока: `block1` и `block2`.
В папках данных блоков на ряду с файлами других технологий расположены папки: `{название блока}.i18n`,
в которых находятся `*.js` файлы с переводами для русского и английского языков.

В этом случае структура файловой системы будет иметь вид:

* - common.blocks
    * - block1
        * - block1.i18n
            * - en.js
            * - ru.js
    * - block2
        * - block1.i18n
            * - en.js
            * - ru.js

При этом каждый файл с переводом должен экспортировать объект в котором ключами являются
имена "скоупов" или групп ключей локализации. В большинстве случаев имя скоупа совпадает с
именем блока. Значениями, соответствующим группам ключей, являются объекты с ключами локализации
изначениями переводов для данных ключей.

Пример такого файла локализации для блока `block1` приведен ниже:

```
module.exports = {
    "block1": {
        "foo1": "bar1",
        "foo2": "bar2",
    }
};
```

Результатом сборки данной технологии например для английского
языка будет файл `{название бандла}.keysets.en.js`, который содержит объект, получившийся
врезультате слияния содержимого файлов `en.js` со всех `*.i18n` директорий  блоков.

Допустим для 2-х блоков `block1` и `block2` существуют соответствующие файлы:

* `common.blocks/block1/block1.i18n/en.js`
* `common.blocks/block2/block2.i18n/en.js`

Содержимое файла `block1`:
```
module.exports = {
    "block1": {
        "foo11": "bar11",
        "foo12": "bar12",
    }
};
```

Содержимое файла `block2`:
```
module.exports = {
    "block2": {
        "foo21": "bar21"
    }
};
```

Результирующий `*.keysets.en.js` файл будет иметь вид:
```
module.exports = {
    "block1": {
        "foo11": "bar11",
        "foo12": "bar12",
    },
    "block2": {
        "foo21": "bar21"
    }
};
```

Отдельного упоминания заслуживает сборка данной технологии для параметра `lang` в значении `'all'`.
В этом случае в результирующий файл `*.keysets.all.js` происходит запись кода ядра BEM.i18n из
библиотеки [bem-core](https://github.com/bem/bem-core).

Стоит также отметить что в рамках данного пакета технология `i18n-merge-keysets` является основной
, т.е. результат ее работы используется при вызове технологий `i18n-keysets-xml` и `i18n-lang-js`.

### i18n-lang-js

Собирает `?.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файлов.

Используется для локализации в JS с помощью BEM.I18N.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.lang.{lang}.js`.
* *String* **lang** — Язык, для которого небходимо собрать файл.
* *String* **keysetsFile** — Исходный keysets-файл. По умолчанию — `?.keysets.{lang}.js`.

**Пример**

```javascript
nodeConfig.addTechs([
  [ require('enb-bem-i18n/techs/i18n-lang-js'), { lang: 'all'} ],
  [ require('enb-bem-i18n/techs/i18n-lang-js'), { lang: '{lang}'} ]
]);
```

Данная технология принимает на вход результаты полученные при выполнении [i18n-merge-keysets](#i18n-merge-keysets),
следовательно для ее работы необходима предварительная сборка `*.keysets.lang.js` файлов при
помощи технологии [i18n-merge-keysets](#i18n-merge-keysets).

Задачей данной технологии является построение кода-обертки для вызова методов локализации
BEM.i18n на основе общей структуры ключей локализации файла `*.keysets.lang.js`

Допустим, что технология `i18n-merge-keysets` сгенерировала `*.keysets.en.js` файл:

```
module.exports = {
 "block1": {
     "foo11": "bar11",
     "foo12": "bar12"
 },
 "block2": {
     "foo21": "bar21"
 }
};
```

Технология `i18n-lang-js` превращает такую структуру данных локализации в код файла `*.lang.en.js`:
```
if (typeof BEM !== 'undefined' && BEM.I18N) {BEM.I18N.decl('block1', {
    "foo11": 'bar11',
    "foo12": 'bar12',
}, {
"lang": "en"
});

BEM.I18N.decl('block2', {
    "foo21": 'bar21'
}, {
"lang": "en"
});

BEM.I18N.lang('en');

}
```
который в дальнейшем может быть использован при локализации в шаблонах или клиентском javascript коде.


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

Данная технология принимает на вход результаты полученные при выполнении [i18n-merge-keysets](#i18n-merge-keysets),
следовательно для ее работы необходима предварительная сборка `*.keysets.lang.js` файлов при
помощи технологии [i18n-merge-keysets](#i18n-merge-keysets).

С помощью данной технологии осуществляется экспорт структуры данных локализации, полученной в результате работы
[i18n-merge-keysets](#i18n-merge-keysets) в xml-файл `*.keysets.<язык>.xml`.

Допустим, что технология `i18n-merge-keysets` сгенерировала `*.keysets.en.js` файл:

```
module.exports = {
 "block1": {
     "foo11": "bar11",
     "foo12": "bar12"
 },
 "block2": {
     "foo21": "bar21"
 }
};
```

Результатом работы технологии `i18n-keysets-xml` для языка `en` станет файл `*.keysets.en.xml` с содержимым:
```
<?xml version="1.0" encoding="utf-8"?>
    <tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:i18n="urn:yandex-functions:internationalization">
    <keyset id="block1">
        <key id="foo1">
            <value>bar11</value>
        </key>
        <key id="foo2">
            <value>bar12</value>
        </key>
    </keyset>
    <keyset id="block2">
        <key id="foo21">
            <value>bar21</value>
        </key>
    </keyset>
</tanker>
```

Тестирование
----------

Запуск тестов:
```
$ npm run unit
```

Запуск проверки js синтаксиса:
```
$ npm run lint
```

Запуск тестов с вычислением покрытия кода тестами:
```
$ npm run cover
```

Последовательная проверка синтаксиса и запуск тестов:
```
$ npm test
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
