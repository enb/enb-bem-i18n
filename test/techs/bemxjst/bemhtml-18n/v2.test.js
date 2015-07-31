var path = require('path'),
    fs = require('fs'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../../../techs/bemxjst/bemhtml-i18n'),
    core = require('../../../fixtures/bem-core-v3/common.blocks/i18n/i18n.i18n.js').i18n.i18n,
    bemhtmlContents;

describe('bemxjst bemhtml-i18n v2', function () {
    before(function () {
        var bemhtmlFilename = './test/fixtures/bem-core/common.blocks/i-bem/i-bem.bemhtml';
        bemhtmlContents = fs.readFileSync(path.resolve(bemhtmlFilename), { encoding: 'utf-8' });
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
                i18n: core
            },
            scope: {
                key: 'val'
            }
        };

        return build(keysets)
            .then(function (exports) {
                var BEMHTML = exports.BEMHTML,
                    bemjson = { block: 'block', scope: 'scope', key: 'key' },
                    html = BEMHTML.apply(bemjson);

                html.must.be('<div class=\"block\">val</div>');
            });
    });

    it('must build fake key if keysets is empty', function () {
        var keysets = {
            i18n: {
                i18n: core
            }
        };

        return build(keysets)
            .then(function (exports) {
                var BEMHTML = exports.BEMHTML,
                    bemjson = { block: 'block', scope: 'scope', key: 'key' },
                    html = BEMHTML.apply(bemjson);

                html.must.be('<div class=\"block\">scope:key</div>');
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
            .then(function (exports) {
                var BEMHTML = exports.BEMHTML,
                    bemjson = { block: 'block', scope: 'scope', key: 'key', params: ['p1', 'p2'] },
                    html = BEMHTML.apply(bemjson);

                html.must.be('<div class=\"block\">p1,p2</div>');
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
            .then(function (exports) {
                var BEMHTML = exports.BEMHTML,
                    bemjson = {
                        block: 'block',
                        scope: 'scope-1',
                        key: 'key',
                        params: { scope: 'scope-1', key: 'key' }
                    },
                    html = BEMHTML.apply(bemjson);

                html.must.be('<div class=\"block\">val</div>');
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
                cache = bundle.getNodeCache('bundle.bemhtml.lang.js'),
                basename = 'bundle.keysets.lang.js',
                filename = path.resolve('bundle', basename);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keysets-file-' + basename, filename);

            mock({
                blocks: {
                    'base.bemhtml': bemhtmlContents,
                    'block.bemhtml': [
                        'block("block").content()(function () {',
                        '    var ctx = this.ctx;',
                        '    return this.i18n(ctx.scope, ctx.key, ctx.params);',
                        '});'
                    ].join('\n')
                },
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

            var fileList = new FileList();

            fileList.loadFromDirSync('blocks');

            bundle.provideTechData('?.files', fileList);

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (exports) {
                    var BEMHTML = exports.BEMHTML,
                        bemjson = {
                            block: 'block',
                            scope: 'scope',
                            key: 'key'
                        },
                        html = BEMHTML.apply(bemjson);

                    html.must.be('<div class=\"block\">val</div>');
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
                cache = bundle.getNodeCache('bundle.bemhtml.lang.js'),
                basename = 'bundle.keysets.lang.js',
                filename = path.resolve('bundle', basename);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keysets-file-' + basename, filename);

            mock({
                blocks: {
                    'base.bemhtml': bemhtmlContents,
                    'block.bemhtml': [
                        'block("block").content()(function () {',
                        '    var ctx = this.ctx;',
                        '    return this.i18n(ctx.scope, ctx.key, ctx.params);',
                        '});'
                    ].join('\n')
                },
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

            var fileList = new FileList();

            fileList.loadFromDirSync('blocks');

            bundle.provideTechData('?.files', fileList);

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (exports) {
                    var BEMHTML = exports.BEMHTML,
                        bemjson = {
                            block: 'block',
                            scope: 'scope',
                            key: 'key'
                        },
                        html = BEMHTML.apply(bemjson);

                    html.must.be('<div class=\"block\">val2</div>');
                });
        });
    });
});

function build(keysets) {
    mock({
        blocks: {
            'base.bemhtml': bemhtmlContents,
            'block.bemhtml': [
                'block("block").content()(function () {',
                '    var ctx = this.ctx;',
                '    return this.i18n(ctx.scope, ctx.key, ctx.params);',
                '});'
            ].join('\n')
        },
        bundle: {
            'bundle.keysets.lang.js': serialize(keysets)
        }
    });

    var bundle = new MockNode('bundle'),
        fileList = new FileList();

    fileList.loadFromDirSync('blocks');

    bundle.provideTechData('?.files', fileList);

    return bundle.runTechAndRequire(Tech, { lang: 'lang' })
        .spread(function (i18n) {
            return i18n;
        });
}

function serialize(js) {
    return 'module.exports = ' + serializeJS(js) + ';';
}
