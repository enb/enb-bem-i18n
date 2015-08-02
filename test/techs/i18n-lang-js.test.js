var mockFs = require('mock-fs'),
    MockNode = require('mock-enb/lib/mock-node'),
    Tech = require('../../techs/i18n-lang-js');

describe('i18n-lang-js', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must get valid *.lang from *.keyset file', function () {
        var keysets = [
                {
                    'lang.js': {
                        scope1: {
                            key11: 'val11',
                            key12: 'val12'
                        },
                        scope2: {
                            key21: 'val21',
                            key22: 'val22'
                        }
                    }
                }
            ],
            expected = [
                'if (typeof BEM !== \'undefined\' && BEM.I18N) {BEM.I18N.decl(\'scope1\', {',
                '    "key11": "val11",',
                '    "key12": "val12"',
                '}, {',
                '"lang": "lang"',
                '});',
                '',
                'BEM.I18N.decl(\'scope2\', {',
                '    "key21": "val21",',
                '    "key22": "val22"',
                '}, {',
                '"lang": "lang"',
                '});',
                '',
                'BEM.I18N.lang(\'lang\');',
                '',
                '}',
                ''
            ].join('\n');

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must get valid *.lang from empty *.keyset file', function () {
        var keysets = [
                {
                    'lang.js': {}
                }
            ],
            expected = [
                'if (typeof BEM !== \'undefined\' && BEM.I18N) {',
                '',
                'BEM.I18N.lang(\'lang\');',
                '',
                '}',
                ''
            ].join('\n');

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must provide core', function () {
        var keysets = [
            {
                'all.js': {
                    '': 'core'
                }
            }
        ];

        return build(keysets, 'all')
            .then(function (res) {
                res.must.be('core');
            });
    });

    describe('cache', function () {
        it('must get keyset from cache', function () {
            var time = new Date(1),
                initial = { val: 'val', mtime: time },
                modified = { val: 'val2', mtime: time },
                expected = [
                    'if (typeof BEM !== \'undefined\' && BEM.I18N) {BEM.I18N.decl(\'scope\', {',
                    '    "key": "val"',
                    '}, {',
                    '"lang": "lang"',
                    '});',
                    '',
                    'BEM.I18N.lang(\'lang\');',
                    '',
                    '}',
                    ''
                ].join('\n');

            return buildWithCache(initial, modified, 'lang')
                .then(function (res) {
                    res.must.eql(expected);
                });
        });

        it('must ignore outdated cache', function () {
            var initial = { val: 'val', mtime: new Date(1) },
                modified = { val: 'val2', mtime: new Date(2) },
                expected = [
                    'if (typeof BEM !== \'undefined\' && BEM.I18N) {BEM.I18N.decl(\'scope\', {',
                    '    "key": "val2"',
                    '}, {',
                    '"lang": "lang"',
                    '});',
                    '',
                    'BEM.I18N.lang(\'lang\');',
                    '',
                    '}',
                    ''
                ].join('\n');

            return buildWithCache(initial, modified, 'lang')
                .then(function (res) {
                    res.must.eql(expected);
                });
        });
    });
});

function build(keysets, lang) {
    var fsScheme = {
        bundle: {}
    };

    for (var i = 0; i < keysets.length; ++i) {
        var keyset = keysets[i],
            basename = Object.keys(keyset)[0],
            data = keyset[basename];

        fsScheme.bundle['bundle.keysets.' + basename] = 'module.exports = ' + JSON.stringify(data) + ';';
    }

    mockFs(fsScheme);

    var bundle = new MockNode('bundle');

    return bundle.runTechAndGetContent(Tech, { lang: lang })
        .spread(function (res) {
            return res.toString();
        });
}

function buildWithCache(initial, modified, lang) {
    function buildScheme(data) {
        return {
            bundle: {
                'bundle.keysets.lang.js': mockFs.file({
                    content: 'module.exports = { scope: { key: "' + data.val + '" } };',
                    mtime: data.mtime
                })
            }
        };
    }

    mockFs(buildScheme(initial));

    var bundle = new MockNode('bundle');

    return bundle.runTechAndGetContent(Tech, { lang: lang })
        .then(function () {
            return mockFs(buildScheme(modified));
        })
        .then(function () {
            return bundle.runTechAndGetContent(Tech, { lang: lang });
        })
        .then(function (res) {
            return res.toString();
        });
}
