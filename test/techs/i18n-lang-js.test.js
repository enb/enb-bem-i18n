var fs = require('fs'),
    path = require('path'),
    mockFs = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    FileList = require('enb/lib/file-list'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
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
                '    "key11": \'val11\',',
                '    "key12": \'val12\'',
                '}, {',
                '"lang": "lang"',
                '});',
                '',
                'BEM.I18N.decl(\'scope2\', {',
                '    "key21": \'val21\',',
                '    "key22": \'val22\'',
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
});

function build(keysets, lang) {
    var fsScheme = {
        bundle: {}
    };

    for (var i = 0; i < keysets.length; ++i) {
        var keyset = keysets[i],
            basename = Object.keys(keyset)[0],
            data = keyset[basename ];

        fsScheme.bundle['bundle.keysets.' + basename] = 'module.exports = ' + JSON.stringify(data) + ';';
    }

    mockFs(fsScheme);

    var bundle = new TestNode('bundle');

    return bundle.runTechAndGetContent(Tech, { lang: lang })
        .spread(function (res) {
            return res.toString();
        });
}

