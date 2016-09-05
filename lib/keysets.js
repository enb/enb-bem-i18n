var path = require('path'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require');

/**
 * Reads file with keysets.
 *
 * @param {String} filename — path to file with keysets.
 * @param {Object} [cache] — instance of {@link Cache}.
 * @param {Object} [root] — path to directory of project root.
 * @returns {Promise}
 */
function read(filename, cache, root) {
    var cacheKey = 'keysets-file-' + (root ? path.relative(root, filename) : filename),
        needRebuildFile = cache ? cache.needRebuildFile(cacheKey, filename) : true;

    if (needRebuildFile) {
        clearRequire(filename);

        return asyncRequire(filename)
            .then(function (keysets) {
                cache.cacheFileInfo(cacheKey, filename);

                return keysets;
            });
    } else {
        return asyncRequire(filename);
    }
}

/**
 * Parses object with keysets.
 *
 * It separates the core of i18n from other keysets. The core will be searched in the `i18n` scope with `i18n` key.
 *
 * @param {(Object.<String, String>|Object.<String, String, Function>)} keysets Object with keysets,
 * example: `{ scope: { key: 'val' } }`. The value can be a function,
 * example: `{ scope: { key: function (params, i18n) { return 'res'; } } }`.
 *
 * @throws Will throw an error if the core is not found.
 * @returns {{ core: Function|String, keysets: (Object.<String, String>|Object.<String, String, Function>) }}
 */
function parse(keysets) {
    var core1, core2,
        data = {};

    // Pull core from source keysets
    keysets && Object.keys(keysets).forEach(function (scope) {
        // Search core in `i18n:i18n`
        if (scope === 'i18n') {
            var keyset = keysets[scope];

            if (keyset && typeof keyset.i18n === 'function') {
                core2 = keyset.i18n;
            }
            // Search deprecated core in `all` scope
        } else if (scope === 'all') {
            var possibleCore = keysets[scope][''];
            if (possibleCore && (typeof possibleCore === 'string') && possibleCore.match(/BEM\.I18N/g)) {
                core1 = possibleCore;
            }
        } else {
            data[scope] = keysets[scope];
        }
    });

    var core = core2 || core1;

    if (!Object.keys(data).length) {
        // No translations — no problems
        return {};
    }

    if (!core) {
        throw new Error('Core of i18n is not found!');
    }

    return {
        core: core,
        keysets: data,
        version: core2 ? 'bem-core' : 'bem-bl'
    };
}

exports.read = read;
exports.parse = parse;
