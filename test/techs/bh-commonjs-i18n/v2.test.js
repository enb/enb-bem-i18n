var EOL = require('os').EOL,
    path = require('path'),
    fs = require('fs'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../../techs/bh-commonjs-i18n'),
    core = require('../../fixtures/bem-core-v3/common.blocks/i18n/i18n.i18n.js').i18n.i18n,
    bhCoreFilename = require.resolve('enb-bh/node_modules/bh/lib/bh.js'),
    bhCoreContents = fs.readFileSync(bhCoreFilename);

describe('bh-commonjs-i18n v2', function () {
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
            .then(function (BH) {
                var bemjson = { block: 'block', scope: 'scope', key: 'key' },
                    html = BH.apply(bemjson);

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
            .then(function (BH) {
                var bemjson = { block: 'block', scope: 'scope', key: 'key' },
                    html = BH.apply(bemjson);

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
            .then(function (BH) {
                var bemjson = { block: 'block', scope: 'scope', key: 'key', params: ['p1', 'p2'] },
                    html = BH.apply(bemjson);

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
            .then(function (BH) {
                var bemjson = {
                        block: 'block',
                        scope: 'scope-1',
                        key: 'key',
                        params: { scope: 'scope-1', key: 'key' }
                    },
                    html = BH.apply(bemjson);

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
                cache = bundle.getNodeCache('bundle.bh.lang.js'),
                basename = 'bundle.keysets.lang.js',
                filename = path.resolve('bundle', basename);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keysets-file-' + basename, filename);

            var scheme = {
                blocks: {
                    'block.bh.js': bhWrap([
                        'bh.match("block", function (ctx, json) {',
                        '    var val = bh.lib.i18n(json.scope, json.key, json.params);',
                        '    ctx.content(val)',
                        '});'
                    ].join(EOL))
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
            };

            scheme[bhCoreFilename] = bhCoreContents;

            mock(scheme);

            var fileList = new FileList();

            fileList.loadFromDirSync('blocks');

            bundle.provideTechData('?.files', fileList);

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (BH) {
                    var bemjson = {
                            block: 'block',
                            scope: 'scope',
                            key: 'key'
                        },
                        html = BH.apply(bemjson);

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
                cache = bundle.getNodeCache('bundle.bh.lang.js'),
                basename = 'bundle.keysets.lang.js',
                filename = path.resolve('bundle', basename);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keysets-file-' + basename, filename);

            var scheme = {
                blocks: {
                    'block.bh.js': bhWrap([
                        'bh.match("block", function (ctx, json) {',
                        '    var val = bh.lib.i18n(json.scope, json.key, json.params);',
                        '    ctx.content(val)',
                        '});'
                    ].join(EOL))
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
            };

            scheme[bhCoreFilename] = bhCoreContents;

            mock(scheme);

            var fileList = new FileList();

            fileList.loadFromDirSync('blocks');

            bundle.provideTechData('?.files', fileList);

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (BH) {
                    var bemjson = {
                            block: 'block',
                            scope: 'scope',
                            key: 'key'
                        },
                        html = BH.apply(bemjson);

                    html.must.be('<div class=\"block\">val2</div>');
                });
        });
    });
});

function bhWrap(str) {
    return 'module.exports = function(bh) {' + str + '};';
}

function build(keysets) {
    var scheme = {
        blocks: {
            'block.bh.js': bhWrap([
                'bh.match("block", function (ctx, json) {',
                '    var val = bh.lib.i18n(json.scope, json.key, json.params);',
                '    ctx.content(val)',
                '});'
            ].join(EOL))
        },
        bundle: {
            'bundle.keysets.lang.js': serialize(keysets)
        }
    };

    scheme[bhCoreFilename] = bhCoreContents;

    mock(scheme);

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
