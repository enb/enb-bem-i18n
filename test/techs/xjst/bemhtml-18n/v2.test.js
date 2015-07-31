var path = require('path'),
    fs = require('fs'),
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    Tech = require('../../../../techs/xjst/bemhtml-i18n'),
    core = require('../../../fixtures/bem-core-v3/common.blocks/i18n/i18n.i18n.js').i18n.i18n,
    bemhtmlContents;

describe('xjst bemhtml-i18n v2', function () {
    before(function () {
        var bemhtmlFilename = require.resolve('enb-xjst/node_modules/bem-bl-xjst/i-bem__html.bemhtml');
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

    it('must throw incompatibility error of XJST templates and bem-core i18n system', function () {
        var keysets = {
            i18n: { i18n: core },
            scope: { key: 'val' }
        };

        return build(keysets)
            .fail(function (error) {
                error.message.must.be('XJST templates can not be used with bem-core i18n system');
            });
    });
});

function build(keysets) {
    mock({
        blocks: {
            'base.bemhtml': bemhtmlContents,
            'block.bemhtml': 'block foo, content: BEM.I18N(this.ctx.scope, this.ctx.key, this.ctx.params)'
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
