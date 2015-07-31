var path = require('path'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    MockNode = require('mock-enb/lib/mock-node'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../../techs/i18n-js'),
    core = require('../../fixtures/bem-core-v3/common.blocks/i18n/i18n.i18n.js').i18n.i18n;

describe('i18n-js v2', function () {
    afterEach(function () {
        mock.restore();
    });

    it('must throw err if i18n is not found', function () {
        var keysets = {};

        return build(keysets)
            .fail(function (err) {
                err.must.a(Error);
                err.message.must.be('Core of i18n is not found!');
            });
    });

    it('must throw err if i18n is not function', function () {
        var keysets = {
            i18n: {
                i18n: 'val'
            }
        };

        return build(keysets)
            .fail(function (err) {
                err.must.a(Error);
                err.message.must.be('Core of i18n is not found!');
            });
    });

    it('must return value', function () {
        var keysets = {
            i18n: {
                i18n: core
            },
            scope: {
                key: 'val'
            }
        };

        return build(keysets)
            .then(function (i18n) {
                i18n('scope', 'key').must.be('val');
            });
    });

    it('must build fake key if keysets is empty', function () {
        var keysets = {
            i18n: {
                i18n: core
            }
        };

        return build(keysets)
            .then(function (i18n) {
                i18n('scope', 'key').must.be('scope:key');
            });
    });

    it('must build key by params', function () {
        var keysets = {
            i18n: {
                i18n: core
            },
            scope: {
                key: function (params) {
                    return params.join();
                }
            }
        };

        return build(keysets)
            .then(function (i18n) {
                i18n('scope', 'key', ['p1', 'p2']).must.be('p1,p2');
            });
    });

    it('must provide i18n instance to function', function () {
        var keysets = {
            i18n: {
                i18n: core
            },
            'scope-1': {
                key: 'val'
            },
            'scope-2': {
                key: function (params, i18n) {
                    return i18n(params.scope, params.key);
                }
            }
        };

        return build(keysets)
            .then(function (i18n) {
                i18n('scope-2', 'key', { scope: 'scope-1', key: 'key' }).must.be('val');
            });
    });

    describe('cache', function () {
        it('must get result from cache', function () {
            var time = new Date(1);

            mock({
                bundle: {
                    'bundle.keysets.lang.js': mock.file({
                        content: serialize({
                            i18n: { i18n: core },
                            scope: { key: 'val' }
                        }),
                        mtime: time
                    })
                }
            });

            var bundle = new MockNode('bundle'),
                cache = bundle.getNodeCache('bundle.lang.lang.js'),
                basename = 'bundle.keysets.lang.js',
                filename = path.resolve('bundle', basename);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keysets-file-' + basename, filename);

            mock({
                bundle: {
                    'bundle.keysets.lang.js': mock.file({
                        content: serialize({
                            i18n: { i18n: core },
                            scope: { key: 'val2' }
                        }),
                        mtime: time
                    })
                }
            });

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (i18n) {
                    i18n('scope', 'key').must.be('val');
                });
        });

        it('must ignore outdated cache', function () {
            mock({
                bundle: {
                    'bundle.keysets.lang.js': mock.file({
                        content: serialize({
                            i18n: { i18n: core },
                            scope: { key: 'val' }
                        }),
                        mtime: new Date(1)
                    })
                }
            });

            var bundle = new MockNode('bundle'),
                cache = bundle.getNodeCache('bundle.lang.lang.js'),
                basename = 'bundle.keysets.lang.js',
                filename = path.resolve('bundle', basename);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keysets-file-' + basename, filename);

            mock({
                bundle: {
                    'bundle.keysets.lang.js': mock.file({
                        content: serialize({
                            i18n: { i18n: core },
                            scope: { key: 'val2' }
                        }),
                        mtime: new Date(2)
                    })
                }
            });

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (i18n) {
                    i18n('scope', 'key').must.be('val2');
                });
        });
    });
});

function build(keysets) {
    mock({
        bundle: {
            'bundle.keysets.lang.js': serialize(keysets)
        }
    });

    var bundle = new MockNode('bundle');

    return bundle.runTechAndRequire(Tech, { lang: 'lang' })
        .spread(function (i18n) {
            return i18n;
        });
}

function serialize(js) {
    return 'module.exports = ' + serializeJS(js) + ';';
}

