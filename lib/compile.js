var serialize = require('serialize-javascript');

/**
 * Compile code of i18n.
 *
 * @param {Function} core The core of i18n.
 * @param {(Object.<String, String>|Object.<String, String, Function>)} keysets Object with keysets,
 * example: `{ scope: { key: 'val' } }`. The value can be a function,
 * example: `{ scope: { key: function (params, i18n) { return 'res'; } } }`.
 *
 * @returns {String}
 */
module.exports = function (core, keysets) {
    return '((' + core + ')()).decl(' + serialize(keysets) + ')';
};
