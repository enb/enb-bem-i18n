enb-bem-i18n [![NPM version](https://badge.fury.io/js/enb-bem-i18n.svg)](http://badge.fury.io/js/enb-bem-i18n) [![Build Status](https://travis-ci.org/enb-bem/enb-bem-i18n.svg?branch=master)](https://travis-ci.org/enb-bem/enb-bem-i18n) [![Dependency Status](https://gemnasium.com/enb-bem/enb-bem-i18n.svg)](https://gemnasium.com/enb-bem/enb-bem-i18n)
============

Поддержка `BEM.I18N` для ENB.

Установка:
----------

```
npm install --save-dev enb-bem-i18n
```

Для работы модуля требуется зависимость от пакета enb версии 0.11.1 или выше.

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
