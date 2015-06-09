var fs = require('fs'),
    path = require('path'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../../techs/i18n-js'),
    core;

describe('i18n-js v1', function () {
    before(function () {
        var p = './test/fixtures/bem-core/common.blocks/i-bem/__i18n/i-bem__i18n.i18n/core.js';
        core = fs.readFileSync(path.resolve(p), { encoding: 'utf-8' });
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

    it('must return value', function () {
        var keysets = {
            all: {
                '': core
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

    it('must get valid *.lang from *.keyset file', function () {
        var keysets = {
            all: { '': core },
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
            all: { '': core }
        };

        return build(keysets)
            .then(function (i18n) {
                i18n('scope', 'key').must.be('');
            });
    });

    describe('cache', function () {
        it('must get result from cache', function () {
            var time = new Date(1);

            mock({
                bundle: {
                    'bundle.keysets.lang.js': mock.file({
                        content: serialize({
                            all: { '': core },
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
                            all: { '': core },
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
                            all: { '': core },
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
                            all: { '': core },
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

