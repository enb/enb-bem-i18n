var fs = require('fs'),
    path = require('path'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    MockNode = require('mock-enb/lib/mock-node'),
    Tech = require('../../../techs/i18n'),
    bemCoreI18nCore = require('../../fixtures/bem-core-v3/common.blocks/i18n/i18n.i18n.js').i18n.i18n,
    bemBLI18NCore;

describe('i18n for bem-bl + bem-core', function () {
    before(function () {
        var bemBLI18NPath = './test/fixtures/bem-core/common.blocks/i-bem/__i18n/i-bem__i18n.i18n/core.js';

        bemBLI18NCore = fs.readFileSync(path.resolve(bemBLI18NPath), { encoding: 'utf-8' });
    });

    afterEach(function () {
        mock.restore();
    });

    it('must use bem-core', function () {
        var keysets = {
            i18n: {
                i18n: bemCoreI18nCore
            },
            all: {
                '': bemBLI18NCore
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
