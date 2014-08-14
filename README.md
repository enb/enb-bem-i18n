enb-bem-i18n
============

[![NPM version](http://img.shields.io/npm/v/enb-bem-i18n.svg?style=flat)](http://badge.fury.io/js/enb-bem-i18n) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-i18n.svg?branch=master&style=flat)](https://travis-ci.org/enb-bem/enb-bem-i18n) [![devDependency Status](http://img.shields.io/david/dev/enb-bem/enb-bem-i18n.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-i18n#info=devDependencies)

Поддержка `BEM.I18N` для ENB.

Установка:
----------

```
npm install --save-dev enb-bem-i18n
```

Для работы модуля требуется зависимость от пакета `enb` версии `0.11.0` или выше.

i18n-lang-js
============

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

i18n-merge-keysets
==================

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
