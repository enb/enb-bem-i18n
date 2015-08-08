var compile1 = require('./compile-v1'),
    compile2 = require('./compile-v2');

/**
 * Compiles code of i18n for `bem-core` or `bem-bl` localization system.
 *
 * Important: XML strings for `bem-bl` translates with `tanker`. `bem-core` not support XML strings.
 *
 * @param {String} core — code that contains i18n core from bem-core or bem-bl library.
 * @param {Object} keysets — a sets of keys and their values (translations) for a language to internationalization.
 * @param {Object} opts
 * @param {String} opts.version — version of core. Use `1` for `bem-bl`, `2` for `bem-core`.
 * @param {String} [opts.language] — language of keysets.
 *
 * @returns {String}
 */
module.exports = function (core, keysets, opts) {
    /*jslint eqeq: true*/
    return opts.version == 1 ?
        compile1(core, keysets, opts.language) :
        compile2(core, keysets);
};
