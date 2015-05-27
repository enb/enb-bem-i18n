/* global oninit */

oninit(function(exports, context) {

    var undef,
        BEM_ = {},
        toString = Object.prototype.toString,
        slice = Array.prototype.slice,
        isArray = Array.isArray || function(obj) {
                return toString.call(obj) === '[object Array]';
            },
        SHORT_TAGS = { // хэш для быстрого определения, является ли тэг коротким
            area : 1, base : 1, br : 1, col : 1, command : 1, embed : 1, hr : 1, img : 1,
            input : 1, keygen : 1, link : 1, meta : 1, param : 1, source : 1, wbr : 1 };

    (function(BEM, undefined) {

        /**
         * Separator for modifiers and their values
         * @const
         * @type String
         */
        var MOD_DELIM = '_',

            /**
             * Separator between block names and a nested element
             * @const
             * @type String
             */
            ELEM_DELIM = '__',

            /**
             * Pattern for acceptable names of elements and modifiers
             * @const
             * @type String
             */
            NAME_PATTERN = '[a-zA-Z0-9-]+';

        function buildModPostfix(modName, modVal) {
            var res = MOD_DELIM + modName;
            if(modVal !== true) res += MOD_DELIM + modVal;
            return res;
        }

        function buildBlockClass(name, modName, modVal) {
            var res = name;
            if(modVal) res += buildModPostfix(modName, modVal);
            return res;
        }

        function buildElemClass(block, name, modName, modVal) {
            var res = buildBlockClass(block) + ELEM_DELIM + name;
            if(modVal) res += buildModPostfix(modName, modVal);
            return res;
        }

        BEM.INTERNAL = {

            NAME_PATTERN : NAME_PATTERN,

            MOD_DELIM : MOD_DELIM,
            ELEM_DELIM : ELEM_DELIM,

            buildModPostfix : buildModPostfix,

            /**
             * Builds the class for a block or element with a modifier
             * @private
             * @param {String} block Block name
             * @param {String} [elem] Element name
             * @param {String} [modName] Modifier name
             * @param {String} [modVal] Element name
             * @returns {String} Class string
             */
            buildClass : function(block, elem, modName, modVal) {
                var typeOfModName = typeof modName;
                if(typeOfModName === 'string' || typeOfModName === 'boolean') {
                    var typeOfModVal = typeof modVal;
                    if(typeOfModVal !== 'string' && typeOfModVal !== 'boolean') {
                        modVal = modName;
                        modName = elem;
                        elem = undef;
                    }
                } else if(typeOfModName !== 'undefined') {
                    modName = undef;
                } else if(elem && typeof elem !== 'string') {
                    elem = undef;
                }

                if(!(elem || modName)) { // simple case optimization
                    return block;
                }

                return elem?
                    buildElemClass(block, elem, modName, modVal) :
                    buildBlockClass(block, modName, modVal);
            },

            /**
             * Builds modifier classes
             * @private
             * @param {String} block Block name
             * @param {String} [elem] Element name
             * @param {Object} [mods] Modifier name
             * @returns {String} Class string
             */
            buildModsClasses : function(block, elem, mods) {
                var res = '';

                if(mods) {
                    var modName; // TODO: do something with OmetaJS and YUI Compressor
                    for(modName in mods) {
                        if(!mods.hasOwnProperty(modName)) continue;

                        var modVal = mods[modName];
                        if(!modVal && modVal !== 0) continue;
                        typeof modVal !== 'boolean' && (modVal += '');

                        res += ' ' + (elem?
                            buildElemClass(block, elem, modName, modVal) :
                            buildBlockClass(block, modName, modVal));
                    }
                }

                return res;
            },

            /**
             * Builds full classes for a block or element with modifiers
             * @private
             * @param {String} block Block name
             * @param {String} [elem] Element name
             * @param {Object} [mods] Modifier name
             * @returns {String} Class string
             */
            buildClasses : function(block, elem, mods) {
                var res = '';

                res += elem?
                    buildElemClass(block, elem) :
                    buildBlockClass(block);

                res += this.buildModsClasses(block, elem, mods);

                return res;
            }

        };

    })(BEM_);

    context.BEMContext = BEMContext;

    function BEMContext(context, apply_) {
        this.ctx = typeof context === 'undefined'? '' : context;
        this.apply = apply_;
        this._str = '';

        // Compatibility stuff, just in case
        var _this = this;
        this._buf = {
            push : function() {
                var chunks = slice.call(arguments).join('');
                _this._str += chunks;
            },
            join : function() {
                return this._str;
            }
        };
        this._ = this;

        // Stub out fields that will be used later
        this._start = true;
        this._mode = '';
        this._listLength = 0;
        this._notNewList = false;
        this.position = 0;
        this.block = undef;
        this.elem = undef;
        this.mods = undef;
        this.elemMods = undef;
    }

    BEMContext.prototype.isArray = isArray;

    BEMContext.prototype.isSimple = function isSimple(obj) {
        if(!obj || obj === true) return true;
        var t = typeof obj;
        return t === 'string' || t === 'number';
    };

    BEMContext.prototype.isShortTag = function isShortTag(t) {
        return SHORT_TAGS.hasOwnProperty(t);
    };

    BEMContext.prototype.extend = function extend(o1, o2) {
        if(!o1 || !o2) return o1 || o2;
        var res = {}, n;
        for(n in o1) o1.hasOwnProperty(n) && (res[n] = o1[n]);
        for(n in o2) o2.hasOwnProperty(n) && (res[n] = o2[n]);
        return res;
    };

    BEMContext.prototype.identify = (function() {
        var cnt = 0,
            id = (+new Date()),
            expando = '__' + id,
            get = function() { return 'uniq' + id + (++cnt); };
        return function(obj, onlyGet) {
            if(!obj) return get();
            if(onlyGet || obj[expando]) {
                return obj[expando];
            } else {
                return (obj[expando] = get());
            }
        };
    })();

    BEMContext.prototype.xmlEscape = function xmlEscape(str) {
        return (str + '').replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };
    BEMContext.prototype.attrEscape = function attrEscape(str) {
        return (str + '').replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
    };
    BEMContext.prototype.jsAttrEscape = function jsAttrEscape(str) {
        return (str + '').replace(/&/g, '&amp;')
            .replace(/'/g, '&#39;');
    };

    BEMContext.prototype.BEM = BEM_;

    BEMContext.prototype.isFirst = function isFirst() {
        return this.position === 1;
    };

    BEMContext.prototype.isLast = function isLast() {
        return this.position === this._listLength;
    };

    BEMContext.prototype.generateId = function generateId() {
        return this.identify(this.ctx);
    };

// Wrap xjst's apply and export our own
    var oldApply = exports.apply;
    exports.apply = BEMContext.apply = function BEMContext_apply(context) {
        var ctx = new BEMContext(context || this, oldApply);
        ctx.apply();
        return ctx._str;
    };

    BEMContext.prototype.reapply = BEMContext.apply;

}); // oninit

match(this._mode === '')(

    match()(function() {
        this.ctx || (this.ctx = {});

        var vBlock = this.ctx.block,
            vElem = this.ctx.elem,
            block = this._currBlock || this.block;

        local('default', {
            block : vBlock || (vElem? block : undefined),
            _currBlock : vBlock || vElem? undefined : block,
            elem : vElem,
            mods : vBlock? this.ctx.mods || (this.ctx.mods = {}) : this.mods,
            elemMods : this.ctx.elemMods || {}
        })(function() {
            (this.block || this.elem)?
                (this.position = (this.position || 0) + 1) :
                this._listLength--;
            apply();
        });
    }),

    match(function() { return this.isArray(this.ctx); })(function() {
        var ctx = this.ctx,
            len = ctx.length,
            i = 0,
            prevPos = this.position,
            prevNotNewList = this._notNewList;

        if(prevNotNewList) {
            this._listLength += len - 1;
        } else {
            this.position = 0;
            this._listLength = len;
        }

        this._notNewList = true;

        while(i < len)
            apply({ ctx : ctx[i++] });

        prevNotNewList || (this.position = prevPos);
    }),

    match(!this.ctx)(function() {
        this._listLength--;
    }),

    match(function() { return this.isSimple(this.ctx); })(function() {
        this._listLength--;

        var ctx = this.ctx;
        if(ctx && ctx !== true || ctx === 0) {
            this._str += ctx + '';
        }
    }),

    // hack-check for Vow-promise
    match(this.ctx && this.ctx._vow)(function() {
        applyCtx(this.ctx._value);
    })

);

def()(function() {
    var BEM_INTERNAL = this.BEM.INTERNAL,
        ctx = this.ctx,
        isBEM,
        tag,
        res;

    local({ _str : '' })(function() {
        var vBlock = this.block;

        tag = apply('tag');
        typeof tag !== 'undefined' || (tag = ctx.tag);
        typeof tag !== 'undefined' || (tag = 'div');

        if(tag) {
            var jsParams, js;
            if(vBlock && ctx.js !== false) {
                js = apply('js');
                js = js? this.extend(ctx.js, js === true? {} : js) : ctx.js === true? {} : ctx.js;
                js && ((jsParams = {})[BEM_INTERNAL.buildClass(vBlock, ctx.elem)] = js);
            }

            this._str += '<' + tag;

            isBEM = apply('bem');
            typeof isBEM !== 'undefined' ||
            (isBEM = typeof ctx.bem !== 'undefined'? ctx.bem : ctx.block || ctx.elem);

            var cls = apply('cls');
            cls || (cls = ctx.cls);

            var addJSInitClass = ctx.block && jsParams && !ctx.elem;
            if(isBEM || cls) {
                this._str += ' class="';
                if(isBEM) {
                    this._str += BEM_INTERNAL.buildClasses(vBlock, ctx.elem, ctx.elemMods || ctx.mods);

                    var mix = apply('mix');
                    ctx.mix && (mix = mix? [].concat(mix, ctx.mix) : ctx.mix);

                    if(mix) {
                        var visited = {},
                            visitedKey = function(block, elem) {
                                return (block || '') + '__' + (elem || '');
                            };

                        visited[visitedKey(vBlock, this.elem)] = true;

                        // Transform mix to the single-item array if it's not array
                        this.isArray(mix) || (mix = [mix]);
                        for(var i = 0; i < mix.length; i++) {
                            var mixItem = mix[i];

                            typeof mixItem === 'string' && (mixItem = { block : mixItem });

                            var hasItem = (mixItem.block && (vBlock !== ctx.block || mixItem.block !== vBlock)) || mixItem.elem,
                                mixBlock = mixItem.block || mixItem._block || this.block,
                                mixElem = mixItem.elem || mixItem._elem || this.elem;

                            hasItem && (this._str += ' ');

                            this._str += BEM_INTERNAL[hasItem? 'buildClasses' : 'buildModsClasses'](
                                mixBlock,
                                mixItem.elem || mixItem._elem ||
                                (mixItem.block? undefined : this.elem),
                                mixItem.elemMods || mixItem.mods);

                            if(mixItem.js) {
                                (jsParams ||
                                (jsParams = {}))[BEM_INTERNAL.buildClass(mixBlock, mixItem.elem)] = mixItem.js === true?
                                {} :
                                    mixItem.js;
                                addJSInitClass || (addJSInitClass = mixBlock && !mixItem.elem);
                            }

                            // Process nested mixes
                            if(hasItem && !visited[visitedKey(mixBlock, mixElem)]) {
                                visited[visitedKey(mixBlock, mixElem)] = true;
                                var nestedMix = apply('mix', {
                                    block : mixBlock,
                                    elem : mixElem
                                });

                                if(nestedMix) {
                                    Array.isArray(nestedMix) || (nestedMix = [nestedMix]);
                                    for(var j = 0; j < nestedMix.length; j++) {
                                        var nestedItem = nestedMix[j];
                                        if(!nestedItem.block &&
                                            !nestedItem.elem ||
                                            !visited[visitedKey(
                                                nestedItem.block,
                                                nestedItem.elem
                                            )]) {
                                            nestedItem._block = mixBlock;
                                            nestedItem._elem = mixElem;
                                            mix.splice(i + 1, 0, nestedItem);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                cls && (this._str += isBEM? ' ' + cls : cls);
                this._str += addJSInitClass? ' i-bem"' : '"';
            }

            if(isBEM && jsParams) {
                this._str += ' data-bem=\'' +
                this.jsAttrEscape(JSON.stringify(jsParams)) +
                '\'';
            }

            var attrs = apply('attrs');
            // NOTE: maybe we need to make an array for quicker serialization
            attrs = this.extend(attrs, ctx.attrs);
            if(attrs) {
                var name, attr; // TODO: do something with OmetaJS and YUI Compressor
                for(name in attrs) {
                    attr = attrs[name];
                    if(typeof attr === 'undefined') continue;
                    this._str += ' ' + name + '="' +
                    this.attrEscape(this.isSimple(attr)?
                        attr :
                        this.reapply(attr)) +
                    '"';
                }
            }
        }

        if(this.isShortTag(tag)) {
            this._str += '/>';
        } else {
            tag && (this._str += '>');

            var content = apply('content');
            if(content || content === 0) {
                isBEM = vBlock || this.elem;
                apply('', {
                    _notNewList : false,
                    position : isBEM? 1 : this.position,
                    _listLength : isBEM? 1 : this._listLength,
                    ctx : content
                });
            }

            tag && (this._str += '</' + tag + '>');
        }

        // If the buffer was replaced, pretend that we're pushing to the buffer
        res = this._str;
    });

    this._buf.push(res);
});

tag()(undefined);
attrs()(undefined);
cls()(undefined);
js()(undefined);
bem()(undefined);
mix()(undefined);
content()(function() { return this.ctx.content; });
