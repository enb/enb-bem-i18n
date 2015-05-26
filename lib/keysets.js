/**
 * Parse object with keysets.
 *
 * It separates the core of i18n from other keysets. The core will be searched in the `i18n` scope with `i18n` key.
 *
 * @param {(Object.<String, String>|Object.<String, String, Function>)} keysets Object with keysets,
 * example: `{ scope: { key: 'val' } }`. The value can be a function,
 * example: `{ scope: { key: function (params, i18n) { return 'res'; } } }`.
 *
 * @throws Will throw an error if the core is not found.
 *
 * @returns {{ core: Function, keysets: (Object.<String, String>|Object.<String, String, Function>) }}
 */
function parse(keysets) {
    var core,
        data = {},
        isDeprecated = false;

    // Pull core from source keysets
    keysets && Object.keys(keysets).forEach(function (scope) {
        // Search core in `i18n:i18n`
        if (scope === 'i18n') {
            var keyset = keysets[scope];

            if (keyset && typeof keyset.i18n === 'function') {
                core = keyset.i18n;
            }
        // Search deprecated core in `all` scope
        } else if (scope === 'all') {
            isDeprecated = true;
            core = keysets[scope][''];
        } else {
            data[scope] = keysets[scope];
        }
    });

    if (!core) {
        throw new Error('Core of i18n is not found!');
    }

    return {
        core: core,
        keysets: data,
        isDeprecated: isDeprecated
    };
}

exports.parse = parse;
