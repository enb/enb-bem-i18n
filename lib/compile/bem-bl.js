var EOL = require('os').EOL,
    tanker = require('../tanker');

/**
 * Compiles code of i18n function for bem-bl localization system.
 *
 * Important: XML strings translates with tanker.
 *
 * @param {String} core — code that contains i18n core from bem-bl library.
 * @param {Object} keysets — a sets of keys and their values (translations) for a language to internationalization.
 * @param {String} lang — language of keysets.
 * @returns {String}
 */
module.exports = function (core, keysets, lang) {
    var scopes = Object.keys(keysets).sort();

    return [
        '(function () {',
        'var __bem__ = {};',
        '(function (BEM) {',
        core,
        '}(__bem__));',
        'var i18n = __bem__.I18N;',
        // initialize i18n with keysets
        scopes.map(function (scope) {
            var keyset = keysets[scope];

            return buildCodeWithDecl(keyset, scope, lang);
        }).join(EOL),
        'i18n.lang(\'' + lang + '\');',
        'return i18n;',
        '}())'
    ].join(EOL);
};

/**
 * Returns code with `i18n.decl` function that initializes an `i18n` instance with keyset.
 *
 * @param {Object} keyset — a set of keys and their values (translations) for a language to internationalization.
 * @param {String} scope — scope of keyset.
 * @param {String} lang — language of keyset.
 * @returns {String|*}
 * @private
 * @example
 * i18n.decl('scope', {
 *     key: 'translation',
 *     hello: function(params) { return "Hello " + params["who"] + "!" }'
 * }, { lang: 'en' });
 */
function buildCodeWithDecl(keyset, scope, lang) {
    var keys = Object.keys(keyset),
        lastIndex = keys.length - 1;

    return [
        'i18n.decl(\'' + scope + '\', {',
        keys.map(function (key, i) {
            var rawValue = keyset[key],           // value can be string with translation
                                                  // or xml code for parameterization
                value = tanker.xmlToJs(rawValue), // string with translation
                                                  // or code of function for parameterization
                endSymbol = i === lastIndex ? '' : ',';

            return JSON.stringify(key) + ':' + value + endSymbol;
        }).join(EOL),
        '}, { "lang": "' + lang + '" });'
    ].join(EOL);
}
