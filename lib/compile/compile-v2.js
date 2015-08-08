var serialize = require('serialize-javascript');

/**
 * Compiles code of i18n function for bem-core localization system.
 *
 * @param {String} core — code that contains i18n core from bem-core library
 * @param {Object} keysets — a sets of keys and their values (translations) for a language to internationalization
 *
 * @returns {String}
 */
module.exports = function (core, keysets) {
    return '((' + core + ')()).decl(' + serialize(keysets) + ')';
};
