var path = require('path'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../techs/i18n-lang-js'),
    core = require('../fixtures/core.js');

describe('i18n-lang-js', function () {
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

    describe('deprecated', function () {
        it('must get valid *.lang from *.keyset file', function () {
            var keysets = [
                    {
                        'lang.js': {
                            all: { '': 'core' },
                            scope1: { key11: 'val11', key12: 'val12' },
                            scope2: { key21: 'val21' }
                        }
                    }
                ],
                expected = [
                    'core',
                    '',
                    'if (typeof BEM !== \'undefined\' && BEM.I18N) {BEM.I18N.decl(\'scope1\', {',
                    '    "key11": \'val11\',',
                    '    "key12": \'val12\'',
                    '}, {',
                    '"lang": "lang"',
                    '});',
                    '',
                    'BEM.I18N.decl(\'scope2\', {',
                    '    "key21": \'val21\'',
                    '}, {',
                    '"lang": "lang"',
                    '});',
                    '',
                    'BEM.I18N.lang(\'lang\');',
                    '',
                    '}',
                    ''
                ].join('\n');

            return buildDeprecated(keysets, 'lang')
                .then(function (res) {
                    res.must.eql(expected);
                });
        });

        it('must get valid *.lang from empty *.keyset file (only core)', function () {
            var keysets = [
                    {
                        'lang.js': {
                            all: { '': 'core' }
                        }
                    }
                ],
                expected = [
                    'core',
                    '',
                    'if (typeof BEM !== \'undefined\' && BEM.I18N) {',
                    '',
                    'BEM.I18N.lang(\'lang\');',
                    '',
                    '}',
                    ''
                ].join('\n');

            return buildDeprecated(keysets, 'lang')
                .then(function (res) {
                    res.must.eql(expected);
                });
        });

        function buildDeprecated(keysets, lang) {
            var fsScheme = {
                bundle: {}
            };

            for (var i = 0; i < keysets.length; ++i) {
                var keyset = keysets[i],
                    basename = Object.keys(keyset)[0],
                    data = keyset[basename];

                fsScheme.bundle['bundle.keysets.' + basename] = 'module.exports = ' + JSON.stringify(data) + ';';
            }

            mock(fsScheme);

            var bundle = new TestNode('bundle');

            return bundle.runTechAndGetContent(Tech, { lang: lang })
                .spread(function (res) {
                    return res.toString();
                });
        }
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

    var bundle = new TestNode('bundle');

    return bundle.runTechAndRequire(Tech, { lang: 'lang' })
        .spread(function (i18n) {
            return i18n;
        });
}

function serialize(js) {
    return 'module.exports = ' + serializeJS(js) + ';';
}
