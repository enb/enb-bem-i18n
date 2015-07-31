var EOL = require('os').EOL,
    path = require('path'),
    fs = require('fs'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../../techs/bh-commonjs-i18n'),
    core,
    bhCoreFilename = require.resolve('enb-bh/node_modules/bh/lib/bh.js'),
    bhCoreContents = fs.readFileSync(bhCoreFilename);

describe('bh-commonjs-i18n v1', function () {
    before(function () {
        var filename = path.resolve('./test/fixtures/bem-core/common.blocks/i-bem/__i18n/i-bem__i18n.i18n/core.js');
        core = fs.readFileSync(path.resolve(filename), { encoding: 'utf-8' });
    });

    afterEach(function () {
        mock.restore();
    });

    it('must throw err if i18n core is not found', function () {
        var keysets = {};

        return build(keysets)
            .fail(function (err) {
                err.must.a(Error);
                err.message.must.be('Core of i18n is not found!');
            });
    });

    it('must throw err if i18n core is not string', function () {
        var keysets = {
            all: {
                '': function () {}
            }
        };

        return build(keysets)
            .fail(function (err) {
                err.must.a(Error);
                err.message.must.be('Core of i18n is not found!');
            });
    });

    it('must throw err if i18n core is not valid', function () {
        var keysets = {
            all: {
                '': 'hello world'
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
            all: {
                '': core
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

    it('must return empty localization value for empty keysets (only core)', function () {
        var keysets = {
            all: {
                '': core
            }
        };

        return build(keysets)
            .then(function (BH) {
                var bemjson = { block: 'block', scope: 'scope', key: 'key' },
                    html = BH.apply(bemjson);

                html.must.be('<div class=\"block\"></div>');
            });
    });

    it('must build key by params', function () {
        var keysets = {
            all: {
                '': core
            },
            scope: {
                key: '<i18n:param>param</i18n:param> value'
            }
        };

        return build(keysets)
            .then(function (BH) {
                var bemjson = { block: 'block', scope: 'scope', key: 'key', params: { param: 1 } },
                    html = BH.apply(bemjson);

                html.must.be('<div class=\"block\">1 value</div>');
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
                            all: { '': core },
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
                            all: { '': core },
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
                            all: { '': core },
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
