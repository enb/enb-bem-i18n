var EOL = require('os').EOL,
    format = require('util').format,
    serialize = require('serialize-javascript'),
    tanker = require('../exlib/tanker');

/**
 * Compile code of i18n.
 *
 * @param {Object} parsed info from keysets file,
 * @param {String} language - language of keysets,
 * example: `{ scope: { key: 'val' } }`. The value can be a function,
 * example: `{ scope: { key: function (params, i18n) { return 'res'; } } }`.
 *
 * @returns {String}
 */
module.exports = function (parsed, language) {
    return parsed.version === 2 ?
    '((' + parsed.core + ')()).decl(' + serialize(parsed.keysets) + ')' :
        compileForVersion1(parsed.core, parsed.keysets, language);
};

/**
 * Compile i18n function for bem-bl localization system
 * @param {String} core - bem-core i18n core code string
 * @param {Object} keysets - keysets hash
 * @param {String} language - language of keysets
 * @returns {String}
 */
function compileForVersion1(core, keysets, language) {
    return [
        '(function () {',
        '    var __bem__ = {};',
        '    (function (BEM) {',
        core,
        '    }(__bem__));',
        '    var i18n = __bem__.I18N;',
        Object.keys(keysets).sort().reduce(function (prev, keysetName, index) {
            index === 0 && prev.push(EOL);
            prev.push(_getKeysetBuildResult(keysetName, keysets[keysetName], language));
            return prev;
        }, []).join(EOL),
        format('\ti18n.lang(\'%s\');', language),
        '    return i18n;',
        '}())'
    ].join(EOL);
}

/**
 * Return decl function call code string for given keyset scope
 * @param {String} scopeName - name of scope
 * @param {Object} scope hash object
 * @param {String} lang - language option value
 * @returns {string|*}
 * @private
 */
function _getKeysetBuildResult(scopeName, scope, lang) {
    var res = Object.keys(scope).reduce(function (prev, key, i, arr) {
        tanker.xmlToJs(scope[key], function (js) {
            var endSymbol = i === arr.length - 1 ? '' : ',';
            prev.push(format('\t    %s: %s%s', JSON.stringify(key), js, endSymbol));
        });
        return prev;
    }, []);
    res.unshift(format('\ti18n.decl(\'%s\', {', scopeName));
    res.push(format('\t}, {%s\t    "lang": "%s"%s\t});', EOL, lang, EOL));
    return res.join(EOL);
}
