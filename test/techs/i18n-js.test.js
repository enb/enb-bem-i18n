var fs = require('fs'),
    path = require('path'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../techs/i18n-js'),
    corev1,
    corev2 = require('../fixtures/core-v2.js');

describe('i18n-js', function () {
    before(function () {
        corev1 = fs.readFileSync(path.resolve('./test/fixtures/core-v1.js'), { encoding: 'utf-8' });
    });

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
                i18n: corev2
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
                i18n: corev2
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
                i18n: corev2
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
                i18n: corev2
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

    describe('corev1', function () {
        it('must get valid *.lang from *.keyset file', function () {
            var keysets = {
                    all: { '': corev1 },
                    scope1: { key11: 'val11', key12: 'val12' },
                    scope2: { key21: 'val21' }
                };
            return build(keysets)
                .then(function (i18n) {
                    i18n('scope1', 'key11').must.be('val11');
                    i18n('scope1', 'key12').must.be('val12');
                    i18n('scope2', 'key21').must.be('val21');
                });
        });


        it('must get valid *.lang from empty *.keyset file (only core)', function () {
            var keysets = {
                all: { '': corev1 }
            };

            return build(keysets)
                .then(function (i18n) {
                    i18n('scope', 'key').must.be('');
                });
        });
    });

    describe('cache', function () {
        it('must get result from cache', function () {
            var time = new Date(1);

            mock({
                bundle: {
                    'bundle.keysets.lang.js': mock.file({
                        content: serialize({
                            i18n: { i18n: corev2 },
                            scope: { key: 'val' }
                        }),
                        mtime: time
                    })
                }
            });

            var bundle = new TestNode('bundle'),
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
                            i18n: { i18n: corev2 },
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
                            i18n: { i18n: corev2 },
                            scope: { key: 'val' }
                        }),
                        mtime: new Date(1)
                    })
                }
            });

            var bundle = new TestNode('bundle'),
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
                            i18n: { i18n: corev2 },
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

    var bundle = new TestNode('bundle');

    return bundle.runTechAndRequire(Tech, { lang: 'lang' })
        .spread(function (i18n) {
            return i18n;
        });
}

function serialize(js) {
    return 'module.exports = ' + serializeJS(js) + ';';
}
