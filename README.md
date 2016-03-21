enb-bem-i18n
============

[![NPM version](https://img.shields.io/npm/v/enb-bem-i18n.svg?style=flat)](https://www.npmjs.org/package/enb-bem-i18n)
[![Build Status](https://img.shields.io/travis/enb/enb-bem-i18n/master.svg?style=flat&label=tests)](https://travis-ci.org/enb/enb-bem-i18n)
[![Build status](https://img.shields.io/appveyor/ci/blond/enb-bh.svg?style=flat&label=windows)](https://ci.appveyor.com/project/blond/enb-bh)
[![Coverage Status](https://img.shields.io/coveralls/enb/enb-bem-i18n.svg?style=flat)](https://coveralls.io/r/enb/enb-bem-i18n?branch=master)
[![devDependency Status](https://img.shields.io/david/enb/enb-bem-i18n.svg?style=flat)](https://david-dm.org/enb/enb-bem-i18n)

Пакет предоставляет набор ENB-технологий для сборки файлов, обеспечивающих мультиязыковую поддержку БЭМ-проектов. Под мультиязыковой поддержкой понимается интернационализация (далее по тексту также i18n).

С помощью технологий пакета `enb-bem-i18n` осуществляется сборка модуля для интернационализации (`i18n`) вашего проекта.

**Технологии пакета `enb-bem-i18n`:**

* [keysets](api.ru.md#keysets) — служебная технология для сборки исходных файлов с переводами.
* [i18n](api.ru.md#i18n) — технология для формирования бандлов с переводами для каждого языка.
* [keysets-xml](api.ru.md#keysets-xml) — технология для локализации сервисов, использующих шаблонизатор XSLT.

Принципы работы технологий и их API описаны в документе [API технологий](./api.ru.md).

**Совместимость:** пакет поддерживает следующие библиотеки:

* [bem-bl](https://ru.bem.info/libs/bem-bl/dev/)
* [bem-core](https://ru.bem.info/libs/bem-core/)

>Особенности реализации для каждой библиотеки описаны в разделе [Различия в использовании `i18n` в `bem-bl` и `bem-core`](#Различия-в-использовании-i18n-в-bem-bl-и-bem-core).

## Установка

Установите пакет `enb-bem-i18n`:
```
npm install --save-dev enb-bem-i18n
```

**Требования:** пакет `enb` версии `0.15.0` или выше.

## Обзор документа

<!-- TOC -->
- [Быстрый старт](#Быстрый-старт)
- [Принцип работы пакета `enb-bem-i18n`](#Принцип-работы-пакета-enb-bem-i18n)
- [Основные понятия](#Основные-понятия)
  - [Исходные данные — keysets](#Исходные-данные--keysets)
    - [Расположение в файловой системе](#Расположение-в-файловой-системе)
  - [Ядро `i18n`](#Ядро-i18n)
- [Описание работы с технологиями](#Описание-работы-с-технологиями)
  - [Объединение данных](#Объединение-данных)
  - [Обработка данных](#Обработка-данных)
  - [Сборка шаблонов](#Сборка-шаблонов)
  - [Сборка только необходимых переводов](#Сборка-только-необходимых-переводов)
- [Использование](#Использование)
  - [В JavaScript](#В-javascript)
    - [Использование в Node.js](#Использование-в-nodejs)
    - [Использование в браузере](#Использование-в-браузере)
  - [В шаблонах](#В-шаблонах)
    - [BEMHTML](#bemhtml)
    - [BH](#bh)
- [API `i18n`](#api-i18n)
  - [Инициализация](#Инициализация)
  - [Передаваемые параметры функции `i18n`](#Передаваемые-параметры-функции-i18n)
- [Различия в использовании `i18n` в `bem-bl` и `bem-core`](#Различия-в-использовании-i18n-в-bem-bl-и-bem-core)
  - [Переключение между языками в runtime](#Переключение-между-языками-в-runtime)
  - [Хранение общих keysets-файлов с переводами](#Хранение-общих-keysets-файлов-с-переводами)
  - [Расположение ядра `i18n`](#Расположение-ядра-i18n)

<!-- TOC END -->

## Быстрый старт

Чтобы собрать файлы интернационализации для каждого языка, подключите необходимые технологии в конфигурационном файле сборщика:

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

## Принцип работы пакета `enb-bem-i18n`

В основе работы пакета `enb-bem-i18n` лежит библиотека для интернационализации — [ядро `i18n`](#Ядро-i18n). Изначально ядро не содержит данных с переводами, оно наполняется данными ([инициализируется](#Инициализация)) из [keysets](#Исходные-данные-keysets)-файлов.

Результатом работы технологии [i18n](api.ru.md#i18n) является [функция `i18n`](#Обработка данных), которая общается с ядром и позволяет получить конкретное значение (строку) для указанного языка. Функция `i18n` может вызываться из [шаблонов](#В-шаблонах) или [клиентского JavaScript-кода](#В-javascript).

## Основные понятия

### Исходные данные — keysets

`keysets` — исходные файлы с переводами для поддержки интернационализации. Перевод представляет собой набор ключей и их значений. Ключ определяет, какое из значений должно быть выбрано для указанного языка.

Пример для русского языка:

```js
{
    hello: 'Привет!'
}
```
Пример для английского языка:

```js
{
    hello: 'Hello!'
}
```

Набор данных `ключ: 'значение'` передается с указанием контекста (`scope`). Обычно контекстом служит имя блока.

Пример keysets-файла для русского языка:

```js
module.exports = {
    greeting: {
        hello: 'Привет!'
    }
};
```

#### Расположение в файловой системе

Переводы (keysets) хранятся в файлах `<lang>.js` (например, `en.js`).

Файлы `<lang>.js` для каждой БЭМ-сущности находятся в отдельной директории `<block-name>.i18n` наряду с другими файлами технологий.

```
block/
    block.css
    block.js
    block.i18n/
        ru.js        # Исходный файл с переводом для русского языка.
        en.js        # Исходный файл с переводом для английского языка.
```

Также есть возможность объединять одинаковые для всех языков переводы в общие файлы:

* В `bem-bl` — в файл `all.js`.
* В `bem-core` — в файл `<block-name>.i18n.js`.

```
common.blocks/
    block1/
        block1.css
        block1.js
        block1.i18n.js       # Исходный файл с переводом, содержащий
                             # общие переводы.
                             # Может содержать ядро `i18n` для библиотеки ` bem-core`.
        block1.i18n/         # Директория для хранения файлов с переводами для разных языков.
            en.js
            ru.js
            all.js           # Исходный файл с переводом (для
                             # русского и английского языков).
                             # Может содержать ядро `i18n` для библиотеки `bem-bl`.
```

### Ядро `i18n`

Ядро `i18n` — это библиотека для интернационализации. Ядро находится в keysets-файлах (`<block-name>.i18n.js` или `<block-name>.all.js`) в одной из базовых библиотек блоков:

* В `bem-bl` — файл `all.js`.
* В `bem-core` — файл `<block-name>.i18n.js`.

Пакет `enb-bem-i18n` поддерживает разные реализации ядра интернационализации для библиотек `bem-bl` и `bem-core`.

* В `bem-bl` — ядро `BEM.I18N`.
* В `bem-core` — ядро `i18n`.

> Далее по тексту для названия ядра будет использоваться `i18n`.

>Подробнее о расположении keysets-файлов, содержащих ядро, в файловой системе читайте в разделе [Расположение в файловой системе](#Расположение-в-файловой-системе).

Ядро `i18n` в библиотеках `bem-core` и `bem-bl` хранится в keysets-файлах по-разному:

* В `bem-bl` (файл `all.js`):

  ```js
  {
      all: {
          '': { // пустая строка
              /* код ядра */
          }
      }
  }
  ```

* В `bem-core` (файл `i18n.js`):

  ```js
  {
      i18n: {
          i18n: {
              /* код ядра */
          }
      }
  }
  ```
Перед использованием ядро должно быть [инициализировано](#Инициализация) данными из keysets-файлов.

**Важно!** Для получения ядра необходимо добавить [mustDeps](https://ru.bem.info/technology/deps/about/)-зависимость блокам, которые используют i18n.

* Для bem-bl:

  ```js
  ({
      mustDeps: { block: 'i-bem', elem: 'i18n' }
  })
  ```

* Для bem-core:

  ```js
  ({
      mustDeps: { block: 'i18n' }
  })
```

>Подробно про API использования ядра `i18n` читайте в разделе [API `i18n`](#api-i18n).

>Примеры всех вариантов использования ядра рассмотрены в [тестах к технологии](https://github.com/enb/enb-bem-i18n/blob/master/test/techs/i18n/).

## Описание работы с технологиями

Данные из keysets-файлов `<lang>.js` во время сборки проходят несколько этапов:

* [Объединение данных исходных файлов в один для указанного языка](#Объединение-данных)
* [Обработка данных из объединенного файла](#Обработка-данных)
* [Сборка шаблонов](#Сборка шаблонов)
* [Сборка только необходимых переводов](#Сборка-только-необходимых-переводов)

### Объединение данных

Технология [keysets](api.ru.md#keysets) объединяет исходные файлы `<lang>.js` для каждого языка в общий файл (`?.keysets.<lang>.js`). Набор языков, для которых будут собраны `?.keysets.<lang>.js`-файлы, задается с помощью опции [lang](api.ru.md#lang) в конфигурационном файле (`.enb/make.js`).

`?.keysets.<lang>.js`-файл — это промежуточный результат сборки, который в дальнейшем используется технологией [i18n](api.ru.md#i18n).

Например, для блоков `greeting` и `login` результирующий `?.keysets.en.js`-файл будет собран следующим образом.

Исходный файл `en.js` блока `greeting`:

```js
module.exports = {
  greeting: {
      hello: 'Hello',
      unknown: 'stranger'
  }
};
```

Исходный файл `en.js` блока `login`:

```js
module.exports = {
  login: {
      login: 'Login',
      pass: 'Password'
  }
};
```

Результирующий `?.keysets.en.js`-файл:

```js
module.exports = {
  greeting: {
      hello: 'Hello',
      unknown: 'stranger'
  },
  login: {
      login: 'Login',
      pass: 'Password'
  }
};
```

### Обработка данных

Данные из объединенного файла `?.keysets.<lang>.js` обрабатываются технологией [i18n](api.ru.md#i18n). Результатом работы является функция `i18n`, которая при вызове из [шаблонов](#В-шаблонах) или [клиентского JavaScript](#В-javascript) принимает ключ и отдает значение (строку) для конкретного языка.

>API взаимодействия с ядром `i18n` описан в разделе [API `i18n`](#api-i18n).
В результате работы технологии [i18n](api.ru.md#i18n) являются `lang.<lang>.js`-файлы, содержащие строки переводов, соответствующие запрошенным ключам.

### Сборка шаблонов

Для сборки интернационализированных шаблонов необходимо отдельно собрать шаблоны, отдельно `i18n`-файлы, а потом склеить их попарно для каждого языка.

```
index.bemhtml.js
index.lang.en.js
index.lang.ru.js

index.en.bemhtml.js  # index.lang.en.js + index.bemhtml.js
index.ru.bemhtml.js  # index.lang.ru.js + index.bemhtml.js
```

После подключения `BEM.I18N` как сторонней библиотеки ее можно использовать:

* в BEMHTML-шаблонах с помощью метода `this.require()`;
* в BH — из пространства имен `bh.lib`.

> Подробнее о том, как подключаются сторонние библиотеки смотрите в документации к пакетам [enb-bemxjst](https://github.com/enb/enb-bemxjst/blob/master/README.md#Подключение-сторонних-библиотек) и [enb-bh](https://github.com/enb/enb-bh/blob/master/README.md#Подключение-сторонних-библиотек).

Файлы `i18n` нужно собирать так, чтобы `i18n`-функция была доступна из переменной `BEM.I18N` в любой среде исполнения. Для этого следует использовать опцию [exports](api.ru.md) со значением `{ globals: 'force' }`.

**Пример сборки BEMHTML и BH шаблонов**

```js
var I18NTech  = require('enb-bem-i18n/techs/i18n'),
    KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    BEMHTMLTech = require('enb-bemxjst/techs/bemhtml'),
    BHTech = require('enb-bh/techs/bh-bundle'),
    FileProvideTech = require('enb/techs/file-provider'),
    FileMergeTech = require('enb/techs/file-merge'),
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
        node.addTech([I18NTech, {
            lang: '{lang}',
            exports: { globals: 'force' }
        }]);

        // Собираем BEMHTML-шаблоны.
        // Подключаем `BEM.I18N` как стороннюю библиотеку.
        // В шаблонах `i18n`-функция будет доступна c помощью метода `this.require('i18n')`.
        node.addTech([BEMHTMLTech, {
            requires: {
                i18n: { globals: 'BEM.I18N' }
            }
        }]);

        // Объединяем скомпилированный BEMHTML-файл с i18n-файлами для каждого языка
        node.addTech([FileMergeTech, {
            target: '?.{lang}.bemhtml.js',
            lang: '{lang}',
            sources: ['?.bemhtml.js', '?.lang.{lang}.js']
        }]);
        node.addTarget('?.{lang}.bemhtml.js');


        // Собираем BH-шаблоны.
        // Подключаем `BEM.I18N` как стороннюю библиотеку.
        // В шаблонах `i18n`-функция будет доступна из `bh.lib.i18n`.
        node.addTech([BHTech, {
            requires: {
                i18n: { globals: 'BEM.I18N' }
            }
        }]);

        // Объединяем скомпилированный BH-файл с i18n-файлами для каждого языка
        node.addTech([FileMergeTech, {
            target: '?.{lang}.bh.js',
            lang: '{lang}',
            sources: ['?.bh.js', '?.lang.{lang}.js']
        }]);
        node.addTarget('?.{lang}.bh.js');
    });
};
```

### Сборка только необходимых переводов

Если в браузере используется только часть переводов (например, когда остальные переводы применяются при шаблонизации в `Node.js`), то для экономии можно собрать только необходимое.

Для этого в [файлах зависимостей](https://ru.bem.info/technology/deps/about/) укажите дополнительную информацию о технологиях, которые используют переводы.

* При использовании в JavaScript-коде блоков в `deps.js`-файл необходимо добавить зависимость для `js`-технологии.

  ```js
  {
      tech: 'js'
      shouldDeps: {
          tech: 'i18n'
      }
  }
  ```

  Такая запись означает, что `js`-технология блока зависит от технологии `i18n` этого же блока. Иначе говоря, в JavaScript-коде, предназначенном для работы в браузере, используются переводы.

  **Важно!** Если в браузер должны попасть все переводы без исключения, то такая запись не обязательна.

* При использовании в коде шаблонов в `deps.js`-файл необходимо добавить зависимость для `bemhtml`- или `bh`-технологии.

  ```js
  {
      tech: 'bemhtml'
      shouldDeps: {
          tech: 'i18n'
      }
  }
  ```

  **Важно:** если в собранные шаблоны должны попасть все переводы без исключения, то такая запись не обязательна.

На основе этой информации в процессе сборки можно составить список БЭМ-сущностей, переводы которых необходимы для работы в браузере.

> Для сборки на основе зависимостей по технологиям понадобится [depsByTechToBemdecl](https://github.com/enb/enb-bem-techs/blob/master/docs/api.ru.md#depsbytechtobemdecl) из пакета [enb-bem-techs](https://github.com/enb/enb-bem-techs/blob/master/README.md).

**Пример сборки i18n для работы в браузере**

```js
var I18NTech  = require('enb-bem-i18n/techs/i18n'),
    KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function () {
        // Получаем FileList
        node.addTechs([
            [bemTechs.levels, { levels: ['blocks'] }],
            [FileProviderTech, { target: '?.bemdecl.js' }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Получаем декларацию `?.i18n.bemdecl.js`, содержащую список только необходимых БЭМ-сущностей
        // для работы i18n в браузере
        node.addTech([bemTechs.depsByTechToBemdecl, {
            target: '?.browser-i18n.bemdecl.js',
            sourceTech: 'js',
            destTech: 'i18n'
        }]);
        node.addTarget('?.browser-i18n.bemdecl.js');

        // Получаем список необходимых файлов с переводами
        node.addTechs([
            [bemTechs.deps, {
                target: '?.browser-i18n.deps.js',
                bemdeclFile: '?.browser-i18n.bemdecl.js'
            }],
            [bemTechs.files, {
                filesTarget: '?.browser-i18n.files',
                dirsTarget: '?.browser-i18n.dirs',
                depsFile: '?.browser-i18n.deps.js'
            }]
        ]);

        // Собираем keyset-файлы для каждого языка
        node.addTech([KeysetsTech, {
            filesTarget: '?.browser-i18n.files',
            lang: '{lang}'
        }]);

        // Собираем i18n-файлы для каждого языка
        node.addTech([I18NTech, { lang: '{lang}' }]);
        node.addTarget('?.lang.{lang}.js');
    });
};
```

Для сборки клиенских шаблонов, которые используют `i18n` можно воспользоваться информацией о JavaScript-зависимостях от технологии шаблонов.

```js
{
    tech: 'js'
    shouldDeps: {
        tech: 'bemhtml' // или `bh`
    }
}
```

**Пример сборки i18n для работы в браузере JavaScript-кода и шаблонов**

```js
var I18NTech  = require('enb-bem-i18n/techs/i18n'),
    KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function (config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function () {
        // Получаем FileList
        node.addTechs([
            [bemTechs.levels, { levels: ['blocks'] }],
            [FileProviderTech, { target: '?.bemdecl.js' }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Получаем декларацию, содержащую список только необходимых БЭМ-сущностей
        // для работы в браузере BEMHTML, который использует i18n.
        node.addTechs([
            // декларация для работы i18n в браузере
            [bemTechs.depsByTechToBemdecl, {
                target: '?.browser-i18n.bemdecl.js',
                sourceTech: 'js',
                destTech: 'i18n'
            }],
            // декларация для работы BEMHTML в браузере
            [bemTechs.depsByTechToBemdecl, {
                target: '?.browser-bemhtml.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            // объединяем декларации
            [bemTechs.mergeBemdecl, {
                sources: ['?.browser-bemhtml.bemdecl.js', '?.browser-i18n.bemdecl.js'],
                target: '?.browser-bemhtml+i18n.bemdecl.js'
            }]
        ]);

        // Получаем список необходимых файлов с переводами
        node.addTechs([
            [bemTechs.deps, {
                target: '?.browser-bemhtml+i18n.deps.js',
                bemdeclFile: '?.browser-bemhtml+i18n.bemdecl.js'
            }],
            [bemTechs.files, {
                filesTarget: '?.browser-bemhtml+i18n.files',
                dirsTarget: '?.browser-bemhtml+i18n.dirs',
                depsFile: '?.browser-bemhtml+i18n.deps.js'
            }]
        ]);

        // Собираем keyset-файлы для каждого языка
        node.addTech([KeysetsTech, {
            filesTarget: '?.browser-bemhtml+i18n.files',
            lang: '{lang}'
        }]);

        // Собираем i18n-файлы для каждого языка
        node.addTech([I18NTech, { lang: '{lang}' }]);
        node.addTarget('?.lang.{lang}.js');
    });
};
```

## Использование

Функция `i18n` может использоваться:

* [в JavaScript](#В-javascript)
* [в шаблонах](#В-шаблонах)

### В JavaScript

Cпособы использования `i18n` в JavaScript зависят от наличия модульной системы в проекте и ее типа. Файлы могут подключаться как [в Node.js](#Использование-в-node.js), так и [в браузере](#Использование-в-браузере), независимо от используемой библиотеки (`bem-bl` или `bem-core`).

#### Использование в Node.js

Скомпилированный файл можно подключить как модуль в формате CommonJS.

```js
var i18n = require('bundle.lang.en.js'); // Путь до скомпилированного файла

i18n('scope', 'key'); // 'val'
```

#### Использование в браузере

В браузере применение скомпиллированных `?.lang.<lang>.js`-файлов зависит от наличия модульной системы:

* **В браузере без YModules как `BEM.I18N`**

  ```js
  BEM.I18N('greeting', 'hello'); // Ядро `i18n` предоставляется в глобальную видимость в переменную `BEM.I18N`.
  ```

* **В браузере с YModules как `i18n`-модуль**

  ```js
  modules.require('i18n', function (i18n) {
      i18n('scope', 'key'); // 'val'
  });
  ```

>**Важно!** В проект с модульной системой ядро библиотеки интернационализации подключаются, как модуль `i18n`, вне зависимости от используемой библиотеки `bem-core` или `bem-bl`.

### В шаблонах

Способы использования `i18n`-функции зависят от [сборки шаблонов](README.md#Сборка-шаблонов).

#### BEMHTML

После подключения `BEM.I18N` как [сторонней библиотеки](https://github.com/enb/enb-bemxjst/blob/master/README.md#Подключение-сторонних-библиотек) ее можно использовать в шаблонах с помощью метода `this.require`.

```js
block('button').elem('tooltip').content()(function () {
    var i18n = this.require('i18n'),  // Библиотека `BEM.I18N`

    // Локализованное значение для ключа `tooltip`
    return i18n('button', 'tooltip');
});
```

#### BH

После подключения `BEM.I18N` как [сторонней библиотеки](https://github.com/enb/enb-bh/blob/master/README.md#Подключение-сторонних-библиотек) ее можно использовать в шаблонах из пространства имен `bh.lib`.

```js
bh.match('block', function (ctx) {
    ctx.content({
        elem: 'tooltip',
        content: bh.lib.i18n('block', 'tooltip');
    });
});
```
## API `i18n`

Описание взаимодействия с ядром `i18n`, результатом которого являются локализованные строки.

### Инициализация

В разделе рассмотрены примеры инициализации ядра на абстрактных файлах для библиотек `bem-bl` и `bem-core`.

* **В `bem-bl`**

  ```js
  var core = /* ... */,
      keyset = {
          hello: 'Привет!'
      },
      lang = 'ru';

  core.decl('greeting', keyset, lang);
  core.lang(lang);

  core('greeting', 'hello'); // Привет!
  ```

* **В `bem-core`**

  ```js
  var core = /* ... */,
      keysets = {
          greeting: {
              hello: "Привет!"
          }
      };

  var i18n = core().decl(keysets);

  i18n('greeting', 'hello'); // Привет!
  ```

### Передаваемые параметры функции `i18n`

Функция `i18n` принимает следующие параметры:

* **scope** — область видимости ключа. Обычно имя блока.
* **key** — ключ, соответствующий значению для указанного языка.
* **params** — входные данные для функции (дополнительный параметр).

Параметризация значений позволяет задавать дополнительный параметр **params**, который будет обработан функцией `i18n` и может повлиять на результат перевода. Например, в этом параметре может передаваться число от 1 до 12, при обработке которого результатом будет месяц, соответствующий указанному числу.

Результат выполнения: строка, содержащая перевод.

* **В `bem-bl`**

  Задавать значения ключей можно не только как строку. Также возможность параметризации значений реализована через XML.

  ```js
  {
      'scope-1': {
          key: 'val'
      },
      'scope-2': {
          key: 'Hello <i18n:param>who</i18n:param>!'
      }
  }
  ```


* **В `bem-core`**

  Задавать значения ключей можно не только как строку. Параметризация значений реализована через функцию.

  Пример:

  ```js
  {
      'scope-1': {
          key: 'val'
      },
      'scope-2': {
          key: function (params, i18n) {
              return i18n(params.scope, params.key);
          }
      }
  }
  ```

  ```js
  modules.require('i18n', function (i18n) {
      i18n('scope-2', 'key', { scope: 'scope-1', key: 'key' }); // Значение
  });
  ```

## Различия в использовании `i18n` в `bem-bl` и `bem-core`

### Переключение между языками в runtime

* В `bem-bl` реализована возможность переключения между языками в runtime.
* В `bem-core` такой возможности нет.

### Хранение общих keysets-файлов с переводами

* В `bem-bl` переводы, одинаковые для всех языков, хранятся в файле `<block-name>.i18n/all.js`.
* В `bem-core` — в файле `<block-name>.i18n.js`.

### Расположение ядра `i18n`

* В `bem-bl` — элемент `i18n` блока `i-bem`.
* В `bem-core` — блок `i18n`.

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
