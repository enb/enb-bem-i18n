var mockFs = require('mock-fs'),
    MockNode = require('mock-enb/lib/mock-node'),
    Tech = require('../../techs/i18n-keysets-xml');

describe('i18n-keysets-xml', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must get valid *.lang.xml from *.keyset file', function () {
        var keysets = [
                {
                    'lang.js': {
                        scope1: {
                            key11: 'val11',
                            key12: 'val12'
                        },
                        scope2: {
                            key21: 'val21'
                        }
                    }
                }
            ],
            expected = [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
                'xmlns:i18n="urn:yandex-functions:internationalization">',
                '<keyset id="scope1">',
                '<key id="key11">',
                '<value>val11</value>',
                '</key>',
                '<key id="key12">',
                '<value>val12</value>',
                '</key>',
                '</keyset>',
                '<keyset id="scope2">',
                '<key id="key21">',
                '<value>val21</value>',
                '</key>',
                '</keyset>',
                '</tanker>'
            ].join('\n');

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must get valid *.lang.xml from *.keyset file with xml values', function () {
        var keysets = [
                {
                    'lang.js': {
                        scope: {
                            key: 'Hello<br>World'
                        }
                    }
                }
            ],
            expected = [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
                'xmlns:i18n="urn:yandex-functions:internationalization">',
                '<keyset id="scope">',
                '<key id="key">',
                '<value>Hello&lt;br&gt;World</value>',
                '</key>',
                '</keyset>',
                '</tanker>'
            ].join('\n');

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must get empty *.lang.xml from empty *.keyset file', function () {
        var keysets = [
                { 'lang.js': {} }
            ],
            expected = [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
                'xmlns:i18n="urn:yandex-functions:internationalization">',
                '',
                '</tanker>'
            ].join('\n');

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    describe('cache', function () {
        it('must get keyset from cache', function () {
            var time = new Date(1),
                initial = { val: 'val', mtime: time },
                modified = { val: 'val2', mtime: time },
                expected = buildExpectedXml('val');

            return buildWithCache(initial, modified, 'lang')
                .then(function (res) {
                    res.must.eql(expected);
                });
        });

        it('must ignore outdated cache', function () {
            var initial = { val: 'val', mtime: new Date(1) },
                modified = { val: 'val2', mtime: new Date(2) },
                expected = buildExpectedXml('val2');

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

function buildExpectedXml(val) {
    return [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
        'xmlns:i18n="urn:yandex-functions:internationalization">',
        '<keyset id="scope">',
        '<key id="key">',
        '<value>' + val + '</value>',
        '</key>',
        '</keyset>',
        '</tanker>'
    ].join('\n');
}
