var fs = require('fs'),
    path = require('path'),
    inspect = require('util').inspect,
    mock = require('mock-fs'),
    serializeJS = require('serialize-javascript'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    FileList = require('enb/lib/file-list'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    Tech = require('../../techs/keysets');

describe('i18n-merge-keysets', function () {
    afterEach(function () {
        mock.restore();
    });

    describe('`i18n` dirs', function () {
        it('must get empty keyset if empty dir', function () {
            var keysets = {
                    'block.i18n': {}
                },
                expected = {};

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must get empty keyset if lang file', function () {
            var keysets = {
                    'block.i18n': {
                        'lang.js': ''
                    }
                },
                expected = {};

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must get keyset', function () {
            var keysets = {
                    'block.i18n': {
                        'lang.js': serialize({
                            scope: {
                                key: 'val'
                            }
                        })
                    }
                },
                expected = {
                    scope: {
                        key: 'val'
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must get keyset by lang', function () {
            var keysets = {
                    'block.i18n': {
                        'ru.js': serialize({
                            'ru-scope': {
                                key: 'ru'
                            }
                        }),
                        'en.js': serialize({
                            'en-scope': {
                                key: 'en'
                            }
                        })
                    }
                },
                expected = {
                    'ru-scope': {
                        key: 'ru'
                    }
                };

            return assert(keysets, expected, { lang: 'ru' });
        });

        it('must support function', function () {
            var keysets = {
                    'block.i18n': {
                        'lang.js': serialize({
                            scope: {
                                key: function () { return '^_^'; }
                            }
                        })
                    }
                },
                expected = {
                    scope: {
                        key: function () { return '^_^'; }
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });

        describe('merge', function () {
            it('must override value', function () {
                var keysets = {
                        'block-1.i18n': {
                            'lang.js': serialize({
                                scope: {
                                    key: 'val'
                                }
                            })
                        },
                        'block-2.i18n': {
                            'lang.js': serialize({
                                scope: {
                                    key: 'val-2'
                                }
                            })
                        }
                    },
                    expected = {
                        scope: {
                            key: 'val-2'
                        }
                    };

                return assert(keysets, expected, { lang: 'lang' });
            });

            it('must merge keys', function () {
                var keysets = {
                        'block-1.i18n': {
                            'lang.js': serialize({
                                scope: {
                                    'key-1': 'val'
                                }
                            })
                        },
                        'block-2.i18n': {
                            'lang.js': serialize({
                                scope: {
                                    'key-2': 'val'
                                }
                            })
                        }
                    },
                    expected = {
                        scope: {
                            'key-1': 'val',
                            'key-2': 'val'
                        }
                    };

                return assert(keysets, expected, { lang: 'lang' });
            });

            it('must merge scopes', function () {
                var keysets = {
                        'block-1.i18n': {
                            'lang.js': serialize({
                                'scope-1': {
                                    key: 'val-1'
                                }
                            })
                        },
                        'block-2.i18n': {
                            'lang.js': serialize({
                                'scope-2': {
                                    key: 'val-2'
                                }
                            })
                        }
                    },
                    expected = {
                        'scope-1': {
                            key: 'val-1'
                        },
                        'scope-2': {
                            key: 'val-2'
                        }
                    };

                return assert(keysets, expected, { lang: 'lang' });
            });
        });
    });

    describe('`i18n.js` files', function () {
        it('must get empty keyset if empty lang file', function () {
            var keysets = {
                    'block.i18n.js': ''
                },
                expected = {};

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must get keyset', function () {
            var keysets = {
                    'block.i18n.js': serialize({
                        scope: {
                            key: 'val'
                        }
                    })
                },
                expected = {
                    scope: {
                        key: 'val'
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });

        describe('merge', function () {
            it('must override value', function () {
                var keysets = {
                        'block-1.i18n.js': serialize({
                            scope: {
                                key: 'val'
                            }
                        }),
                        'block-2.i18n.js': serialize({
                            scope: {
                                key: 'val-2'
                            }
                        })
                    },
                    expected = {
                        scope: {
                            key: 'val-2'
                        }
                    };

                return assert(keysets, expected, { lang: 'lang' });
            });

            it('must merge keys', function () {
                var keysets = {
                        'block-1.i18n.js': serialize({
                            scope: {
                                'key-1': 'val'
                            }
                        }),
                        'block-2.i18n.js': serialize({
                            scope: {
                                'key-2': 'val'
                            }
                        })
                    },
                    expected = {
                        scope: {
                            'key-1': 'val',
                            'key-2': 'val'
                        }
                    };

                return assert(keysets, expected, { lang: 'lang' });
            });

            it('must merge scopes', function () {
                var keysets = {
                        'block-1.i18n.js': serialize({
                            'scope-1': {
                                key: 'val-1'
                            }
                        }),
                        'block-2.i18n.js': serialize({
                            'scope-2': {
                                key: 'val-2'
                            }
                        })
                    },
                    expected = {
                        'scope-1': {
                            key: 'val-1'
                        },
                        'scope-2': {
                            key: 'val-2'
                        }
                    };

                return assert(keysets, expected, { lang: 'lang' });
            });
        });
    });

    describe('`i18n.js` files + `i18n` dirs', function () {
        it('must add common scope', function () {
            var keysets = {
                    'block.i18n.js': serialize({
                        'common-scope': {
                            key: 'val'
                        }
                    }),
                    'block.i18n': {
                        'lang.js': serialize({
                            'lang-scope': {
                                key: 'val'
                            }
                        })
                    }
                },
                expected = {
                    'common-scope': {
                        key: 'val'
                    },
                    'lang-scope': {
                        key: 'val'
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must override value', function () {
            var keysets = {
                    'block.i18n.js': serialize({
                        scope: {
                            key: 'val'
                        }
                    }),
                    'block.i18n': {
                        'lang.js': serialize({
                            scope: {
                                key: 'val-2'
                            }
                        })
                    }
                },
                expected = {
                    scope: {
                        key: 'val-2'
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must merge keys', function () {
            var keysets = {
                    'block.i18n': {
                        'lang.js': serialize({
                            scope: {
                                'key-1': 'val'
                            }
                        })
                    },
                    'block.i18n.js':  serialize({
                        scope: {
                            'key-2': 'val'
                        }
                    })
                },
                expected = {
                    scope: {
                        'key-1': 'val',
                        'key-2': 'val'
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });

        it('must merge scopes', function () {
            var keysets = {
                    'block.i18n': {
                        'lang.js': serialize({
                            'scope-1': {
                                key: 'val-1'
                            }
                        })
                    },
                    'block.i18n.js': serialize({
                        'scope-2': {
                            key: 'val-2'
                        }
                    })
                },
                expected = {
                    'scope-1': {
                        key: 'val-1'
                    },
                    'scope-2': {
                        key: 'val-2'
                    }
                };

            return assert(keysets, expected, { lang: 'lang' });
        });
    });

    it('must provide old core', function () {
        var keysets = {
                'block.i18n': {
                    'all.js': serialize({
                        all: {
                            '': 'core'
                        }
                    })
                }
            },
            expected = {
                all: {
                    '': 'core'
                }
            };

        return assert(keysets, expected, { lang: 'lang' });
    });

    describe('cache', function () {
        it('must get keysets from cache', function () {
            var time = new Date(1);

            mock({
                blocks: {
                    'block.i18n.js': mock.file({
                        content: serialize({ scope: { key: 'val' } }),
                        mtime: time
                    })
                },
                bundle: {}
            });

            var bundle = new TestNode('bundle'),
                dirname = path.resolve('blocks'),
                fileList = new FileList(),
                dirList = new FileList();

            fileList.loadFromDirSync(dirname);

            bundle.provideTechData('?.files', fileList);
            bundle.provideTechData('?.dirs', dirList);

            return bundle.runTechAndRequire(Tech, { lang: 'lang' })
                .spread(function () {
                    mock({
                        blocks: {
                            'block.i18n.js': mock.file({
                                content: serialize({ scope: { key: 'val2' } }),
                                mtime: time
                            })
                        },
                        bundle: {}
                    });
                    return bundle.runTechAndRequire(Tech, { lang: 'lang' });
                })
                .spread(function (res) {
                    res.must.eql({ scope: { key: 'val' } });
                });
        });

        it('must ignore outdated cache', function () {
            var time = new Date(1);

            mock({
                blocks: {
                    'block.i18n.js': mock.file({
                        content: serialize({ scope: { key: 'val' } }),
                        mtime: time
                    })
                },
                bundle: {}
            });

            var bundle = new TestNode('bundle'),
                cache = bundle.getNodeCache('bundle.keysets.lang.js'),
                dirname = path.resolve('blocks'),
                basename = 'block.i18n.js',
                filename = path.join(dirname, basename),
                fileList = new FileList(),
                dirList = new FileList();

            fileList.loadFromDirSync(dirname);

            bundle.provideTechData('?.files', fileList);
            bundle.provideTechData('?.dirs', dirList);

            dropRequireCache(require, filename);
            require(filename);
            cache.cacheFileInfo('keyset-file-' + basename, filename);

            mock({
                blocks: {
                    'block.i18n.js': mock.file({
                        content: serialize({ scope: { key: 'val2' } }),
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

function assert(keysets, expected, opts) {
    opts || (opts = {});

    var scheme = {
        blocks: keysets,
        bundle: {}
    };

    mock(scheme);

    var dirnames = Object.keys(keysets).filter(function (basename) {
            return path.extname(basename) === '.i18n';
        }),
        filenames = Object.keys(keysets).filter(function (basename) {
            return path.extname(basename) === '.js';
        }),
        bundle = new TestNode('bundle'),
        fileList = new FileList(),
        dirList = new FileList(),
        root = 'blocks',
        files = filenames.map(function (basename) {
            var filename = path.resolve(root, basename);

            return FileList.getFileInfo(filename);
        }),
        dirs = dirnames.map(function (basename) {
            var dirname = path.resolve(root, basename),
                info = FileList.getFileInfo(dirname);

            info.files = fs.readdirSync(dirname).map(function (basename) {
                var filename = path.join(dirname, basename);

                return FileList.getFileInfo(filename);
            });

            return info;
        });

    dirList.addFiles(dirs);
    fileList.addFiles(files);

    bundle.provideTechData('?.files', fileList);
    bundle.provideTechData('?.dirs', dirList);

    return bundle.runTechAndRequire(Tech, { lang: opts.lang })
        .spread(function (res) {
            if (inspect(expected).indexOf('[Function]') === -1) {
                // Если ожидается JSON-объект, то сравниваем как объекты
                res.must.eql(expected);
            } else {
                // Если ожидается JavaScript, то сравниваем как строки
                serialize(res).must.eql(serialize(expected));
            }
        });
}

function serialize(js) {
    return 'module.exports = ' + serializeJS(js) + ';';
}
