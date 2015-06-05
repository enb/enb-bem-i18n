var fs = require('fs'),
    path = require('path'),
    mockFs = require('mock-fs'),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../techs/i18n-merge-keysets');

describe('i18n-merge-keysets', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('must get keyset from lang file', function () {
        var keysets = [
                {
                    'lang.js': {
                        scope: {
                            key: 'val'
                        }
                    }
                }
            ],
            expected = {
                scope: {
                    key: 'val'
                }
            };

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must get keyset by lang', function () {
        var keysets = [
                {
                    'ru.js': {
                        'ru-scope': {
                            key: 'val'
                        }
                    },
                    'en.js': {
                        'ru-scope': {
                            key: 'val'
                        }
                    }
                }
            ],
            expected = {
                'ru-scope': {
                    key: 'val'
                }
            };

        return build(keysets, 'ru')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must override value', function () {
        var keysets = [
                {
                    'lang.js': {
                        scope: {
                            key: 'val'
                        }
                    }
                },
                {
                    'lang.js': {
                        scope: {
                            key: 'val-2'
                        }
                    }
                }
            ],
            expected = {
                scope: {
                    key: 'val-2'
                }
            };

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must merge keys', function () {
        var keysets = [
                {
                    'lang.js': {
                        scope: {
                            'key-1': 'val'
                        }
                    }
                },
                {
                    'lang.js': {
                        scope: {
                            'key-2': 'val'
                        }
                    }
                }
            ],
            expected = {
                scope: {
                    'key-1': 'val',
                    'key-2': 'val'
                }
            };

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must merge scopes', function () {
        var keysets = [
                {
                    'lang.js': {
                        'scope-1': {
                            key: 'val-1'
                        }
                    }
                },
                {
                    'lang.js': {
                        'scope-2': {
                            key: 'val-2'
                        }
                    }
                }
            ],
            expected = {
                'scope-1': {
                    key: 'val-1'
                },
                'scope-2': {
                    key: 'val-2'
                }
            };

        return build(keysets, 'lang')
            .then(function (res) {
                res.must.eql(expected);
            });
    });

    it('must provide core', function () {
        var keysets = [
                {
                    'all.js': {
                        all: {
                            '': 'core'
                        }
                    }
                }
            ];

        return build(keysets, 'all')
            .then(function (res) {
                res[''].must.be('core');
            });
    });

    describe('cache', function () {
        it('must get keyset from cache', function () {
            var time = new Date(1);

            mockFs({
                'block.i18n': {
                    'lang.js': mockFs.file({
                        content: 'module.exports = { scope: { key: "val" } };',
                        mtime: time
                    })
                },
                bundle: {}
            });

            var bundle = new MockNode('bundle'),
                cache = bundle.getNodeCache('bundle.keysets.lang.js'),
                fileList = new FileList(),
                dirname = path.resolve('block.i18n'),
                filename = path.join(dirname, 'lang.js'),
                info = FileList.getFileInfo(dirname);

            info.files = [FileList.getFileInfo(filename)];
            fileList.addFiles([info]);

            bundle.provideTechData('?.dirs', fileList);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keyset-file-lang.js', filename);

            mockFs({
                'block.i18n': {
                    'lang.js': mockFs.file({
                        content: 'module.exports = { scope: { key: "val2" } };',
                        mtime: time
                    })
                },
                bundle: {}
            });

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (res) {
                    res.must.eql({ scope: { key: 'val' } });
                });
        });

        it('must ignore outdated cache', function () {
            mockFs({
                'block.i18n': {
                    'lang.js': mockFs.file({
                        content: 'module.exports = { scope: { key: "val" } };',
                        mtime: new Date(1)
                    })
                },
                bundle: {}
            });

            var bundle = new MockNode('bundle'),
                cache = bundle.getNodeCache('bundle.keysets.lang.js'),
                fileList = new FileList(),
                dirname = path.resolve('block.i18n'),
                filename = path.join(dirname, 'lang.js'),
                info = FileList.getFileInfo(dirname);

            info.files = [FileList.getFileInfo(filename)];
            fileList.addFiles([info]);

            bundle.provideTechData('?.dirs', fileList);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keyset-file-lang.js', filename);

            mockFs({
                'block.i18n': {
                    'lang.js': mockFs.file({
                        content: 'module.exports = { scope: { key: "val2" } };',
                        mtime: new Date(2)
                    })
                },
                bundle: {}
            });

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function (res) {
                    res.must.eql({ scope: { key: 'val2' } });
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
            data = keyset[basename],
            file = {};

        file[basename] = 'module.exports = ' + JSON.stringify(data) + ';';

        fsScheme[i + '.i18n'] = file;
    }

    mockFs(fsScheme);

    var bundle = new MockNode('bundle'),
        fileList = new FileList(),
        dirs = keysets.map(function (keyset, i) {
            var dirname = path.resolve(i + '.i18n'),
                info = FileList.getFileInfo(dirname);

            info.files = fs.readdirSync(dirname).map(function (basename) {
                var filename = path.join(dirname, basename);

                return FileList.getFileInfo(filename);
            });

            return info;
        });

    fileList.addFiles(dirs);
    bundle.provideTechData('?.dirs', fileList);

    return bundle.runTechAndRequire(Tech, { lang: lang })
        .spread(function (res) {
            return res;
        });
}
