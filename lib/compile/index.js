var compileForBemBL = require('./bem-bl'),
    compileForBemCore = require('./bem-core');

/**
 * Compiles code of i18n for `bem-core` or `bem-bl` localization system.
 *
 * Important: XML strings for `bem-bl` translates with `tanker`. `bem-core` not support XML strings.
 *
 * @param {String} core — code that contains i18n core from bem-core or bem-bl library.
 * @param {Object} keysets — a sets of keys and their values (translations) for a language to internationalization.
 * @param {Object} opts
 * @param {String} opts.version — version of core: `bem-bl` or `bem-core`.
 * @param {String} [opts.language] — language of keysets.
 *
 * @returns {String}
 */
module.exports = function (core, keysets, opts) {
    if (opts.version === 'bem-core') {
        return compileForBemCore(core, keysets);
    }

    if (opts.version === 'bem-bl') {
        return compileForBemBL(core, keysets, opts.language);
    }
};
