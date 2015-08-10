var sax = require('../exlib/sax');

/**
 * Надстройка над функцией translate для обратной совместимости.
 * Внимание. Интерфейс с колбеком _синхронный_, это не ошибка.
 *
 * @param {String|String[]} raw Ключ
 * @param {Function} [callback] Колбек
 * @return {String}
 */
module.exports.xmlToJs = function (raw, callback) {
    if (callback) {
        callback(translate(raw));
    } else {
        return translate(raw);
    }
};

/**
 * Метод преобразует XML-строку с «танкерной» разметкой
 * в JS, пригодный для использования в декларациях BEM.I18N.
 *
 * @param {String|String[]} raw Ключ
 * @return {String}
 */
function translate(raw) {
    var key = normalize(raw);

    // Нет смысла запускать тяжелый парсер,
    // если в строке нет признаков танкерной разметки или мнемоник.
    if (!/(<i18n:)|(&)/i.test(key)) {
        return JSON.stringify(key);
    }

    var parser = sax.parser(),
        tree = new Tree();

    parser.ontext = function (text) {
        // Текст внутри <i18n:dynamic> незначимый (пробелы, переносы строк).
        if (tree.context.type === 'dynamic' || tree.context.type === 'dynamic_bare') {
            return;
        // Текст внутри <i18n:js> это кодовый сниппет, не должен быть обернут в кавычки.
        }
        if (tree.context.type === 'js') {
            tree.pushText(text);
        // В остальных случаях это текстовый чанк.
        } else {
            tree.pushText(JSON.stringify(text));
        }
    };
    parser.onopentag = function (tag) {
        var name = tag.name,
            attr = tag.attributes;

        if (name === 'I18N:PARAM') {
            tree.pushNode('param');
        } else if (name === 'I18N:DYNAMIC') {
            if (attr.KEYSET && attr.KEY) {
                tree.pushNode('dynamic', {
                    key: attr.KEY.toLowerCase(),
                    keyset: ((attr.PROJECT ? 'i-' + attr.PROJECT + '__' : '') + attr.KEYSET).toLowerCase()
                });
            } else {
                tree.pushNode('dynamic_bare');
            }
        // <i18n:js> рассматривается особым образом только в контексте пустого <i18n:dynamic>.
        } else if (name === 'I18N:JS' && tree.context.type === 'dynamic_bare') {
            tree.pushNode('js');
        } else if (tree.context.type === 'dynamic') {
            tree.pushNode('property', {
                name: name.split(':').pop().toLowerCase()
            });
        } else {
            tree.pushNode('wtf');
        }
    };
    parser.onclosetag = function () {
        // Пустые теги следует воспринимать как теги, содержащие пустую строку.
        if (!tree.context.body.length) {
            parser.ontext('');
        }
        tree.stepBack();
    };

    // Пустой комментарий, чтобы парсер не игнорировал пробелы в начале строки.
    parser.write('<!---->' + key).close();

    return tree.toString();
}

function Tree() {
    this.tree = {
        type: null,
        body: [],
        data: {},
        parent: null
    };
    this.context = this.tree;
}

Tree.prototype = {
    pushText: function (text) {
        this.context.body.push(text);
    },
    pushNode: function (type, data) {
        var node = {
            type: type || 'wtf',
            body: [],
            data: data || {},
            parent: this.context
        };

        this.context.body.push(node);
        this.context = node;

        if (!this.tree.type && node.type !== 'wtf') {
            this.tree.type = 'parametrized';
        }
    },
    stepBack: function () {
        this.context = this.context.parent;
    },
    tmpl: {
        skip: ['${body}', ''],
        parametrized: ['function(params) { return ${body} }', ' + '],
        param: ['params[${body}]', ' + '],
        dynamic: ['this.keyset("${keyset}").key("${key}", {${body}})', ', '],
        property: ['"${name}": ${body}', ' + '],
        js: ['(function(params) { ${body} }).call(this, params)', '']
    },
    toString: function () {
        var node = arguments[0] || this.tree,
            tmpl = this.tmpl[node.type] || this.tmpl.skip,
            result;

        if (!Array.isArray(node.body)) {
            result = node;
        } else {
            var chunkTmpl = tmpl[0],
                separator = tmpl[1];

            result = fill(chunkTmpl, extend(node.data, {
                body: node.body.filter(function (item) {
                    return item.type !== 'wtf';
                }).map(this.toString, this).join(separator)
            }));
        }

        return result || JSON.stringify('');
    }
};

/**
 * Нормализация состоит в том, чтобы массив, элементы которого представляют
 * формы склоняемого ключа (мы считаем, что массив всегда имеет такой смысл),
 * заменить на соответствующий XML.
 *
 * Если передан не массив, то аргумент просто приводится к строке.
 *
 * @param {*} raw
 * @return {String}
 */
function normalize(raw) {
    return Array.isArray(raw) ? getPluralKey(raw) : String(raw);
}

function getPluralKey(arr) {
    return fill([
        '<i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv">',
        '<i18n:count><i18n:param>count</i18n:param></i18n:count>',
        '<i18n:one>${0}</i18n:one>',
        '<i18n:some>${1}</i18n:some>',
        '<i18n:many>${2}</i18n:many>',
        '<i18n:none>${3}</i18n:none>',
        '</i18n:dynamic>'
    ].join(''), arr);
}

function extend(base, supp) {
    return Object.keys(supp).reduce(function (base, key) {
        base[key] = supp[key];
        return base;
    }, base);
}

function fill(str, obj) {
    return str.replace(/\${(\w+)}/g, function (match, name) {
        return obj[name] || '';
    });
}
