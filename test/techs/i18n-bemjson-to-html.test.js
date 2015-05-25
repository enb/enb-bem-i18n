var mock = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    Tech = require('../../techs/i18n-bemjson-to-html'),
    writeFile = require('../lib/write-file');

describe('i18n-bemjson-to-html', function () {
    var bundle, i18n;

    beforeEach(function () {
        i18n = [
            'var BEM = {',
            '    I18N: function () {',
            '        return "i18n-key";',
            '    }',
            '};'
        ].join('\n');
    });

    afterEach(function () {
        mock.restore();
    });

    describe('must generate html with i18n', function () {
        function testForTemplate(template, templateName) {
            var scheme = {
                blocks: {},
                bundle: {
                    'bundle.bemjson.js': '({ block: "block" })',
                    'bundle.lang.all.js': i18n,
                    'bundle.lang.ru.js': ''
                }
            };

            scheme.bundle['bundle.' + (templateName || 'template') + '.js'] = template;

            mock(scheme);

            bundle = new TestNode('bundle');

            return bundle.runTechAndGetContent(
                Tech, { templateFile: '?.' + (templateName || 'template') + '.js', lang: 'ru' }
            ).spread(function (html) {
                return html.toString();
            });
        }

        it('must generate valid html for bemhtml template', function () {
            testForTemplate('exports.BEMHTML.apply = function(bemjson) { return "<html>" + BEM.I18N() + "</html>"; };')
                .then(function (html) {
                    html.must.be('<html>i18n-key</html>');
                });
        });

        it('must generate valid html for bh template', function () {
            testForTemplate('exports.apply = function(bemjson) { return "<html>" + BEM.I18N() + "</html>"; };')
                .then(function (html) {
                    html.must.be('<html>i18n-key</html>');
                });
        });

        it('must use valid template file', function () {
            var template = 'exports.apply = function(bemjson) { return "<html>" + BEM.I18N() + "</html>"; };';
            testForTemplate(template, 'bh')
                .then(function (html) {
                    html.must.be('<html>i18n-key</html>');
                });
        });
    });

    describe('caches', function () {
        it('must not use outdated BEMJSON', function () {
            var scheme = {
                blocks: {},
                bundle: {
                    'bundle.bemjson.js': '({ block: "block" })',
                    'bundle.template.js':
                        'exports.apply = function(bemjson) { return "<html>" +bemjson.block+ "</html>"; };',
                    'bundle.lang.all.js': i18n,
                    'bundle.lang.ru.js': ''
                }
            };

            mock(scheme);

            bundle = new TestNode('bundle');

            return bundle.runTech(
                Tech, { templateFile: '?.template.js', lang: 'ru' }
            ).then(function () {
                    return writeFile(
                        'bundle/bundle.bemjson.js',
                        '({ block: "anotherBlock" })'
                    );
                })
                .then(function () {
                    return bundle.runTechAndGetContent(Tech, { templateFile: '?.template.js', lang: 'ru' });
                })
                .spread(function (html) {
                    html.toString().must.be('<html>anotherBlock</html>');
                });
        });

        it('must not use outdated template bundle file', function () {
            var scheme = {
                blocks: {},
                bundle: {
                    'bundle.bemjson.js': '({ block: "block" })',
                    'bundle.template.js': 'exports.apply = function(bemjson) { return "<html>^_^</html>"; };',
                    'bundle.lang.all.js': i18n,
                    'bundle.lang.ru.js': ''
                }
            };

            mock(scheme);

            bundle = new TestNode('bundle');

            return bundle.runTech(
                Tech, { templateFile: '?.template.js', lang: 'ru' }
            ).then(function () {
                    return writeFile(
                        'bundle/bundle.template.js',
                        'exports.apply = function(bemjson) { return "<html>o_o</html>"; };'
                    );
                })
                .then(function () {
                    return bundle.runTechAndGetContent(Tech, { templateFile: '?.template.js', lang: 'ru' });
                })
                .spread(function (html) {
                    html.toString().must.be('<html>o_o</html>');
                });
        });
    });
});
