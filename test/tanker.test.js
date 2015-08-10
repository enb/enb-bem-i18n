// jscs:disable maximumLineLength
var chai = require('chai'),
    assert = chai.assert,
    xmlToJs = require('../lib/tanker.js').xmlToJs;

// assert.xmlToJs(a, b) ≡ assert.strictEqual(xmlToJs(a), b)
chai.use(function (chai) {
    chai.assert.xmlToJs = function (inp, exp, msg) {
        new chai.Assertion(xmlToJs(inp), msg).to.equal(exp);
    };
});

describe('tanker', function () {
    it('callback', function (done) {
        var raw = 'str',
            expected = JSON.stringify(raw);

        xmlToJs(raw, function (res) {
            assert.strictEqual(res, expected);
            done();
        });
    });

    // Строки без танкерного XML и мнемоник, а также некорректные типы данных.
    describe('простые формы ключей', function () {
        ([
            '',
            'hello',
            'he\'l\"lo',
            'h\u1234e\t\n\\\\"lo',
            0,
            123456789,
            null,
            undefined,
            true,
            false,
            { hello: 'world' },
            { hello: 'hello <i18n:param>world</i18n:param>' },
            'hello<br>world'
        ]).forEach(function (key) {
            // Ожидаем, что аргумент будет приведен к строке и обернут в кавычки через JSON.stringify.
            it(JSON.stringify(key) + ' → ' + JSON.stringify(String(key)), function () {
                assert.strictEqual(xmlToJs(key), JSON.stringify(String(key)));
            });
        });
    });

    describe('ключи, содержащие html-разметку и мнемоники', function () {
        it('Ключ с тегом <a> и мнемоникой &copy;', function () {
            assert.xmlToJs(
                'Можно <a class=\"link\" href=\"{url}\">загрузить</a> на &copy; Яндекс.Диск.',
                '"Можно <a class=\\"link\\" href=\\"{url}\\">загрузить</a> на © Яндекс.Диск."'
            );
        });

        it('Ключ с тегами <br />', function () {
            assert.xmlToJs(
                'Фильтрация выключена.<br />Умеренный фильтр включится<br />автоматически через 2 часа.',
                '"Фильтрация выключена.<br />Умеренный фильтр включится<br />автоматически через 2 часа."'
            );
        });

        it('Ключ с тегами <p> и <a>', function () {
            assert.xmlToJs(
                'Merhaba! <p>Ulaşmak istediğiniz sayfa sadece Yandex.Browser\'da görüntülenebilmektedir. Devam etmek için buraya <a href="http://browser.yandex.com.tr?from=kazan" class="b-link" target="_blank">tıklayın</a>.</p>',
                '"Merhaba! <p>Ulaşmak istediğiniz sayfa sadece Yandex.Browser\'da görüntülenebilmektedir. Devam etmek için buraya <a href=\\"http://browser.yandex.com.tr?from=kazan\\" class=\\"b-link\\" target=\\"_blank\\">tıklayın</a>.</p>"'
            );
        });

        it('Параметризиванный ключ с мнемоникой &alpha;', function () {
            assert.xmlToJs(
                '&alpha; <i18n:param>world</i18n:param>',
                'function(params) { return "α " + params["world"] }'
            );
        });
    });

    describe('параметризованные ключи', function () {
        it('Простой параметризованный ключ', function () {
            assert.xmlToJs(
                'Hello <i18n:param>who</i18n:param>!',
                'function(params) { return "Hello " + params["who"] + "!" }'
            );
        });
        it('Ключ, состоящий из одного параметра', function () {
            assert.xmlToJs(
                '<i18n:param>pampam</i18n:param>',
                'function(params) { return params["pampam"] }'
            );
        });
        it('Ключ, содержащий несколько параметров', function () {
            assert.xmlToJs(
                'Hello <i18n:param>number</i18n:param> <i18n:param>count</i18n:param>!',
                'function(params) { return "Hello " + params["number"] + " " + params["count"] + "!" }'
            );
        });
    });

    describe('склоняемые ключи', function () {
        it('Склоняемый в виде массива с четыремя формами', function () {
            assert.xmlToJs(
                ['Один ответ', 'Два ответа', 'Несколько ответов', 'Нет ответов'],
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "one": "Один ответ", "some": "Два ответа", "many": "Несколько ответов", "none": "Нет ответов"}) }'
            );
        });
        it('Склоняемый в виде массива с четыремя формами, часть форм параметризованы', function () {
            assert.xmlToJs(
                ['Один ответ', '<i18n:param>count</i18n:param> ответа', '<i18n:param>count</i18n:param> ответов', 'Нет ответов'],
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "one": "Один ответ", "some": params["count"] + " ответа", "many": params["count"] + " ответов", "none": "Нет ответов"}) }'
            );
        });
        it('Склоняемый в виде массива с тремя формами, часть форм параметризованы', function () {
            assert.xmlToJs(
                ['Один ответ', '<i18n:param>count</i18n:param> ответа', '<i18n:param>count</i18n:param> ответов'],
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "one": "Один ответ", "some": params["count"] + " ответа", "many": params["count"] + " ответов", "none": ""}) }'
            );
        });
        it('Склоняемый в виде пустого массива', function () {
            assert.xmlToJs(
                [],
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "one": "", "some": "", "many": "", "none": ""}) }'
            );
        });
        it('Склоняемый в XML виде с тремя формами (plural)', function () {
            assert.xmlToJs(
                '<i18n:dynamic project="tanker" keyset="dynamic" key="plural"><i18n:count><i18n:param>count</i18n:param></i18n:count><i18n:one>всего один адрес, простите</i18n:one><i18n:some>пару адресов</i18n:some><i18n:many>много адресов</i18n:many></i18n:dynamic>',
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural", {"count": params["count"], "one": "всего один адрес, простите", "some": "пару адресов", "many": "много адресов"}) }'
            );
        });
        it('Склоняемый в XML виде с четыремя формами (plural_adv), часть форм параметризованы', function () {
            assert.xmlToJs(
                '<i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv"><i18n:count><i18n:param>count</i18n:param></i18n:count><i18n:one><i18n:param>count</i18n:param> адрес</i18n:one><i18n:some><i18n:param>count</i18n:param> адреса</i18n:some><i18n:many><i18n:param>count</i18n:param> адресов</i18n:many><i18n:none><i18n:param>count</i18n:param> адресов</i18n:none></i18n:dynamic>',
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "one": params["count"] + " адрес", "some": params["count"] + " адреса", "many": params["count"] + " адресов", "none": params["count"] + " адресов"}) }'
            );
        });
        it('Склоняемый в XML виде с четыремя формами (plural_adv), часть форм параметризованы, непосредственно внутри <i18n:dynamic> пробельные символы', function () {
            assert.xmlToJs(
                '<i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv">\n\n   \n<i18n:count><i18n:param>count</i18n:param></i18n:count><i18n:one><i18n:param>count</i18n:param> адрес</i18n:one><i18n:some><i18n:param>count</i18n:param> адреса</i18n:some><i18n:many>  <i18n:param>count</i18n:param> адресов</i18n:many> <i18n:none>  <i18n:param>count</i18n:param> адресов</i18n:none>   </i18n:dynamic>',
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "one": params["count"] + " адрес", "some": params["count"] + " адреса", "many": "  " + params["count"] + " адресов", "none": "  " + params["count"] + " адресов"}) }'
            );
        });
    });

    describe('ключи со ссылками на другие ключи', function () {
        it('Ключ состоящий только из параметризованной ссылки на другой ключ', function () {
            assert.xmlToJs(
                '<i18n:dynamic keyset="keyset" key="key"><i18n:prop>property</i18n:prop></i18n:dynamic>',
                'function(params) { return this.keyset("keyset").key("key", {"prop": "property"}) }'
            );
        });

        it('Ключ, содержащий параметр и параметризованную ссылку на другой ключ', function () {
            assert.xmlToJs(
                'Вылет через <i18n:param>hour</i18n:param> <i18n:dynamic keyset="np-card-airplane-ticket" key="hour"><i18n:count><i18n:param>hour</i18n:param></i18n:count></i18n:dynamic>',
                'function(params) { return "Вылет через " + params["hour"] + " " + this.keyset("np-card-airplane-ticket").key("hour", {"count": params["hour"]}) }'
            );
        });

        it('Ключ состоящий только из параметризованной ссылки на другой ключ в проекте tanker', function () {
            assert.xmlToJs(
                '<i18n:dynamic project="tanker" keyset="keyset" key="key"><i18n:count><i18n:param>count</i18n:param></i18n:count><i18n:one>one</i18n:one><i18n:some>some</i18n:some><i18n:many>many</i18n:many><i18n:none>none</i18n:none></i18n:dynamic>',
                'function(params) { return this.keyset("i-tanker__keyset").key("key", {"count": params["count"], "one": "one", "some": "some", "many": "many", "none": "none"}) }'
            );
        });

        it('Ключ с двуми параметризованными ссылками и параметром', function () {
            assert.xmlToJs([
                    '<i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv">',
                    '   <i18n:count><i18n:param>count</i18n:param></i18n:count>',
                    '   <i18n:none></i18n:none>',
                    '   <i18n:one>Найдена</i18n:one>',
                    '   <i18n:some>Найдено</i18n:some>',
                    '   <i18n:many>Найдено</i18n:many>',
                    '</i18n:dynamic> <i18n:param>count</i18n:param> <i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv">',
                    '   <i18n:count><i18n:param>count</i18n:param></i18n:count>',
                    '   <i18n:none></i18n:none>',
                    '   <i18n:one>страница.</i18n:one>',
                    '   <i18n:some>страницы.</i18n:some>',
                    '   <i18n:many>страниц.</i18n:many>',
                    '</i18n:dynamic>'
                ].join('\n'),
                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "none": "", "one": "Найдена", "some": "Найдено", "many": "Найдено"}) + " " + params["count"] + " " + this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "none": "", "one": "страница.", "some": "страницы.", "many": "страниц."}) }'
            );
        });
    });

    describe('ключи с js вставками', function () {
        it('Ключ, представляющий из себя вставку js кода', function () {
            assert.xmlToJs(
                '<i18n:dynamic><i18n:js>alert("Hello World")</i18n:js></i18n:dynamic>',
                'function(params) { return (function(params) { alert("Hello World") }).call(this, params) }'
            );
        });

        it('Ключ, представляющий из себя вставку js кода и несколько незначимых элементов', function () {
            assert.xmlToJs(
                '<i18n:dynamic><i18n:js>alert("Hello World")</i18n:js><i18n:ignore></i18n:ignore><i18n:them/><i18n:all>hello</i18n:all></i18n:dynamic>',
                'function(params) { return (function(params) { alert("Hello World") }).call(this, params) }'
            );
        });

        it('Ключ, представляющий из себя вставку js кода в контексте строки', function () {
            assert.xmlToJs(
                'Hello <i18n:dynamic><i18n:js>return "World";</i18n:js></i18n:dynamic>!',
                'function(params) { return "Hello " + (function(params) { return "World"; }).call(this, params) + "!" }'
            );
        });
    });

    describe('ключи с вложенными ключами', function () {
        it('Параметризованный ключ с параметрами, вложенными друг в друга', function () {
            assert.xmlToJs(
                'Hello <i18n:param>number<i18n:param>count</i18n:param></i18n:param>!',
                'function(params) { return "Hello " + params["number" + params["count"]] + "!" }'
            );
        });

        it('Ключ с тремя ссылками, вложенными друг в друга', function () {
            assert.xmlToJs([
                '<i18n:dynamic project="tanker" keyset="dynamic" key="toggle">  <!-- D1 -->',
                '    <i18n:condition><i18n:param>today</i18n:param></i18n:condition>',
                '    <i18n:true>сегодня</i18n:true>',
                '    <i18n:false><i18n:dynamic project="tanker" keyset="dynamic" key="toggle">  <!-- D2 -->',
                '        <i18n:condition><i18n:param>tomorrow</i18n:param></i18n:condition>',
                '        <i18n:true>завтра</i18n:true>',
                '        <i18n:false><i18n:param>day</i18n:param> <i18n:dynamic keyset="i-date" key="months-gen">  <!-- D3 -->',
                '            <i18n:num><i18n:param>month</i18n:param></i18n:num>',
                '        </i18n:dynamic></i18n:false>',
                '    </i18n:dynamic></i18n:false>',
                '</i18n:dynamic>'].join('\n'),

                'function(params) { return this.keyset("i-tanker__dynamic").key("toggle", {"condition": params["today"], "true": "сегодня", "false": this.keyset("i-tanker__dynamic").key("toggle", {"condition": params["tomorrow"], "true": "завтра", "false": params["day"] + " " + this.keyset("i-date").key("months-gen", {"num": params["month"]})})}) }'
            );
        });

        it('Ключ с беспорядочной вложенностью, html-разметкой, незначащими пробельными символами', function () {
            assert.xmlToJs([
                '<i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv">',
                '    <i18n:count><i18n:param>count</i18n:param></i18n:count>',
                '    <i18n:none>Ничего не найдено на страницах Помощи.</i18n:none>',
                '    <i18n:one><p contenteditable="true" class="i-face" style="margin:0;"><i18n:dynamic project="help" keyset="i-locale" key="not-found-in-section"/></p>Найдена</i18n:one>',
                '    <i18n:some><p><i18n:dynamic project="help" keyset="i-locale" key="not-found-in-section"/></p>Найдено</i18n:some>',
                '    <i18n:many><p><i18n:dynamic project="help" keyset="i-locale" key="not-found-in-section"/></p>Найдено</i18n:many>',
                '</i18n:dynamic> <i18n:param>count</i18n:param> <i18n:dynamic project="tanker" keyset="dynamic" key="plural_adv">',
                '    <i18n:count><i18n:param>count</i18n:param></i18n:count>',
                '    <i18n:none></i18n:none>',
                '    <i18n:one>страница.</i18n:one>',
                '    <i18n:some>страницы.</i18n:some>',
                '    <i18n:many>страниц.</i18n:many>',
                '</i18n:dynamic>'].join('\n'),

                'function(params) { return this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "none": "Ничего не найдено на страницах Помощи.", "one": "<p contenteditable=\\"true\\" class=\\"i-face\\" style=\\"margin:0;\\">" + this.keyset("i-help__i-locale").key("not-found-in-section", {}) + "</p>Найдена", "some": "<p>" + this.keyset("i-help__i-locale").key("not-found-in-section", {}) + "</p>Найдено", "many": "<p>" + this.keyset("i-help__i-locale").key("not-found-in-section", {}) + "</p>Найдено"}) + " " + params["count"] + " " + this.keyset("i-tanker__dynamic").key("plural_adv", {"count": params["count"], "none": "", "one": "страница.", "some": "страницы.", "many": "страниц."}) }'
            );
        });
    });

    describe('особые случаи', function () {
        it('Параметризованный ключ, начинающийся с пробелов', function () {
            assert.xmlToJs(
                '          <i18n:param>world</i18n:param>',
                'function(params) { return "          " + params["world"] }'
            );
        });

        it('Ключ, состоящий из одного невалидного тега', function () {
            assert.xmlToJs(
                '<i18n:invalid>pampam</i18n:invalid>',
                '""'
            );
        });

        it('Ключ с текстом и невалидным тегом', function () {
            assert.xmlToJs(
                'hello <i18n:js>var a = 123;</i18n:js>',
                '"hello "'
            );
        });
    });
});
// jscs:enable maximumLineLength
