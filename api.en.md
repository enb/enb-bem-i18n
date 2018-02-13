# Technologies API

The package includes the following technologies:

* [keysets](#keysets)  — Technology for collecting source files with translations.
* [i18n](#i18n) — Technology that generates a common bundle with translations for each language.
* [keysets-xml](#keysets-xml) — Technology for localizing projects using XSLT for templating.

## keysets

Technology that creates a result that is used by other technologies in the `enb-bem-i18n` package. Collects data (`keysets`) for the language specified in the `?.keysets. <lang>.js` file based on `<lang>.js` files.

### Options

* [target](#target)
* [lang](#lang)
* [dirsTarget](#dirstarget)
* [sourceDirSuffixes](#sourcedirsuffixes)

#### target

Type: `String`. Default: `?.keysets.<lang>.js`.

The name for saving the result of building the necessary `<lang>. js` files for the project – a compiled `?.keysets.<lang>.js` file.

The `?.keysets.<lang>.js` file is an intermediate build result that is later used by the [i18n](#i18n) technology.

#### lang

Type: `String`. Required option.

The language to build the file for.

Acceptable values:

* **'lang'** — The value of the language (two-letter language code, such as `'en'` or `'ru'`) that data will be collected for (`keysets`) from `<lang>.js` files.

* **'{lang}'**  — The directive that invokes the technology the required number of times and substitutes the value in `'lang'` with each of the languages specified in the parameters of the `config.setLanguages()` function.

#### dirsTarget

Type: `String`. Default: `?.i18n`.

The name of the target for accessing the list of source directories for the build. The list of directories is provided by the [files](https://github.com/enb/enb-bem-techs/blob/master/docs/api/api.en.md#files) technology in the [enb-bem-techs](https://github.com/enb/enb-bem-techs) package.

#### sourceDirSuffixes

Type: `String | String[]`. Default: `['.i18n']`.

The directory suffixes to use for filtering for the build.

**Example**

```js
var KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function(node) {
        // Getting the FileList
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Building the keyset files for each language
        node.addTech([KeysetsTech, { lang: '{lang}' }]);
        node.addTarget('?.keysets.{lang}.js');
    });
};
```

## i18n

Builds `?.lang.<lang>.js` files for a language based on data from the `?.keysets.<lang>.js` files that were obtained as the result of using the [keysets](#keysets) technology.

`i18n` — A build technology that converts data from `?.keysets.<lang>.js` files to JavaScript.

The `i18n` technology initializes the `i18n`  core with data from merged keyset files and returns the `i18n` function, which can be used from [templates](README.md) or [client JavaScript](README.md).

> For information about the `i18n` API, see the section [i18n API](README.md#api-i18n).

### Options

* [target](#target-1)
* [lang](#lang-1)
* [keysetsFile](#keysetsfile)
* [exports](#exports)

#### target

Type: `String`. Default: `?.lang.<lang>.js`.

Name of the file for saving the result of compiling data from the `?.keysets.<lang>.js` file – a compiled `?.lang.<lang>.js` file.

#### lang

Type: `String`. Required option.

The language to build the file for with the translations.

Acceptable values:

* **'lang'** — The value of the language (for example, `'en'` or `'ru'`) to collect data for (`keysets`) from the `<lang>.js` files.

* **'{lang}'** — The directive that invokes the technology the required number of times and substitutes the value in `'lang'` with each of the languages specified in the parameters of the `config.setLanguages()` function.

#### keysetsFile

Type: `String`. Default: `?.keysets.<lang>.js`.

`?.keysets.<lang>.js` file — The result of running [keysets](#keysets) – a set of data (`keysets`) for the specified language that uses the [i18n](#i18n) technology for creating `?.lang.<lang>.js` files.

#### exports

Type: `Object`. Default: `{ globals: true: true, commonJS ym: true }`.

Configures the method for getting the `i18n` function.

Possible options:

* `globals: true` — The `i18n` function will be available from the `BEM.I18N` global variable, if the runtime environment does not use modular systems. If you want the global variable to be available with modular systems, you need to specify the special value `globals: ' force '`.
* `commonJS: true` — The compiled file can be connected as a CommonJS module.
* `ym: true` — The `i18n` function will be available from the [YModules](https://en.bem.info/tools/bem/modules/) modular system.

**Example**

```js
var I18NTech  = require('enb-bem-i18n/techs/i18n'),
    KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function(node) {
        // Getting the FileList
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Getting the keyset files for each language
        node.addTech([KeysetsTech, { lang: '{lang}' }]);

        // Building the i18n files for each language
        node.addTech([I18NTech, { lang: '{lang}' }]);
        node.addTarget('?.lang.{lang}.js');
    });
};
```

## keysets-xml

Builds `?.keysets.<lang>.xml` files based on `?.keysets.<lang>.js` files.

The `keysets-xml` technology is used for localizing services that use [XSLT](https://github.com/veged/xjst) for templating.
It is used for localizing XML pages.

### Options

* [target](#target-2)
* [lang](#lang-2)

#### target

Type: `String`. Default: `?.keysets.{lang}.js`.

The resulting XML file.

#### lang

Type: `String`. Required option.

The language to build the file for.

**Example**

```js
var KeysetsTech = require('enb-bem-i18n/techs/keysets'),
    KeysetsXMLTech = require('enb-bem-i18n/techs/keysets-xml'),
    FileProvideTech = require('enb/techs/file-provider'),
    bemTechs = require('enb-bem-techs');

module.exports = function(config) {
    config.setLanguages(['en', 'ru']);

    config.node('bundle', function(node) {
        // Getting the FileList
        node.addTechs([
            [FileProvideTech, { target: '?.bemdecl.js' }],
            [bemTechs.levels, { levels: ['blocks'] }],
            [bemTechs.deps],
            [bemTechs.files]
        ]);

        // Getting the keyset files for each language
        node.addTech([KeysetsTech, { lang: '{lang}' }]);

        // Getting the XML files for each language
        node.addTech([KeysetsXMLTech, { lang: '{lang}' }]);
        node.addTarget('?.keysets.{lang}.js');
    });
};
```
