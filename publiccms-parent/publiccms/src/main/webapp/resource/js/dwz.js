/**
 * @author ZhangHuihua@msn.com
 */
var DWZ = {
    version: "1.6.2" ,
    regPlugins: [ ], // [function($parent){} ...]
    // sbar: show sidebar
    keyCode: {
        ENTER: 13, ESC: 27, END: 35, HOME: 36, SHIFT: 16, TAB: 9, LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, DELETE: 46, BACKSPACE: 8, CHAR_S: 83
    } ,
    eventType: {
        pageClear: "pageClear", // 用于重新ajaxLoad、关闭nabTab, 关闭dialog时，去除xheditor等需要特殊处理的资源
        resizeGrid: "resizeGrid", // 用于窗口或dialog大小调整
        initEnvAfter: "initEnvAfter" // initEnv完成触发
    } ,
    isOverAxis: function(x, reference, size) {
        // Determines when x coordinate is over "b" element axis
        return ( x > reference ) && ( x < ( reference + size ) );
    } ,
    isOver: function(y, x, top, left, height, width) {
        // Determines when x, y coordinates is over "b" element
        return this.isOverAxis(y, top, height) && this.isOverAxis(x, left, width);
    } ,

    pageInfo: {
        pageNum: "pageNum", numPerPage: "numPerPage", orderField: "orderField", orderDirection: "orderDirection"
    } ,
    statusCode: {
        ok: 200, okAndRefresh: 201, error: 300, timeout: 301
    } ,
    keys: {
        statusCode: "statusCode", message: "message"
    } ,
    ui: {
        sbar: true
    } ,
    frag: {}, // page fragment
    _msg: {}, // alert message
    _set: {
        loginUrl: "", // session timeout
        loginTitle: "", // if loginTitle open a login dialog
        debug: false
    } ,
    msg: function(key, args) {
        var _format = function(str, args) {
            args = args || [ ];
            var result = str || "";
            for (var i = 0; i < args.length; i++) {
                result = result.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
            }
            return result;
        }
        return _format(this._msg[key], args);
    } ,
    debug: function(msg) {
        if (this._set.debug ) {
            if (typeof ( console ) != "undefined" ) {
                console.log(msg);
            } else {
                alert(msg);
            }
        }
    } ,
    loadLogin: function() {
        if ($.pdialog && DWZ._set.loginTitle ) {
            $.pdialog.open(DWZ._set.loginUrl, "login", DWZ._set.loginTitle, {
                mask: true, width: 520, height: 260
            });
        } else {
            window.location = DWZ._set.loginUrl;
        }
    } ,
    instances : {},
    /*
     * json to string
     */
    obj2str: function(o) {
        var r = [ ];
        if (typeof o == "string" ) {
            return "\"" + o.replace(/([\'\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
        }
        if (typeof o == "object" ) {
            if (!o.sort ) {
                for ( var i in o)
                    r.push("\""+i + "\":" + DWZ.obj2str(o[i]));
                if (!!document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString) ) {
                    r.push("toString:" + o.toString.toString());
                }
                r = "{" + r.join() + "}"
            } else {
                for (var i = 0; i < o.length; i++) {
                    r.push(DWZ.obj2str(o[i]));
                }
                r = "[" + r.join() + "]"
            }
            return r;
        }
        return o.toString();
    } ,
    jsonEval: function(data) {
        try {
            if ($.type(data) == 'string' ) {
                return eval('(' + data + ')');
            } else {
                return data;
            }
        } catch (e) {
            return {};
        }
    } ,
    ajaxError: function(xhr, ajaxOptions, thrownError) {
        if (alertMsg ) {
            if('undefined' == typeof thrownError||"" ==thrownError){
                var exception = $($.parseHTML(xhr.responseText, document, true)).find('#divexception textarea');
                if(exception.length){
                    thrownError=exception.val();
                }
            }
            alertMsg.error("<div>Http status: " + xhr.status + " " + xhr.statusText + "</div>" + "<div>ajaxOptions: " + ajaxOptions + "</div>" + "<div>thrownError: " + thrownError
                    + "</div>");
        } else {
            alert("Http status: " + xhr.status + " " + xhr.statusText + "\najaxOptions: " + ajaxOptions + "\nthrownError:" + thrownError + "\n" + xhr.responseText);
        }
    },
    ajaxDone: function(json) {
        if (json[DWZ.keys.statusCode] == DWZ.statusCode.error ) {
            if (json[DWZ.keys.message] && alertMsg ) {
                alertMsg.error(json[DWZ.keys.message]);
            }
        } else if (json[DWZ.keys.statusCode] == DWZ.statusCode.timeout ) {
            if (alertMsg ){
                alertMsg.error(json[DWZ.keys.message] || DWZ.msg("sessionTimout"), {
                    okCall: DWZ.loadLogin
                });
            } else {
                DWZ.loadLogin();
            }
        } else if (json[DWZ.keys.statusCode] == DWZ.statusCode.okAndRefresh ){
            if (json[DWZ.keys.message] && alertMsg ){
                alertMsg.correct(json[DWZ.keys.message],{
                    callback:function(){
                        window.location.reload();
                    }
                });
            }
        } else {
            if (json[DWZ.keys.message] && alertMsg ){
                alertMsg.correct(json[DWZ.keys.message]);
            }
        }
    },
    init: function(pageFrag, options) {
        var op = $.extend({
            loginUrl: "login.html", loginTitle: null, callback: null, debug: false, statusCode: {}
        }, options);
        this._set.loginUrl = op.loginUrl;
        this._set.loginTitle = op.loginTitle;
        this._set.debug = op.debug;
        $.extend(DWZ.statusCode, op.statusCode);
        $.extend(DWZ.keys, op.keys);
        $.extend(DWZ.pageInfo, op.pageInfo);
        $.ajax({
            type: 'GET', url: pageFrag, dataType: 'html', cache: false, error: function(xhr) {
                alert(xhr.statusText);
            }, success: function(html) {
                $($.parseHTML(html, document, true)).each(function() {
                    var pageId = $(this).attr("id");
                    if (pageId ) {
                        DWZ.frag[pageId] = $(this).text();
                    }
                });
                if ($.isFunction(op.callback) ) {
                    op.callback();
                }
            }
        });
        var _doc = $(document);
        if (!_doc.isBind(DWZ.eventType.pageClear) ) {
            _doc.bind(DWZ.eventType.pageClear, function(event) {
                var box = event.target;
                $("textarea.editor", $(box)).each(function() {
                    if('ckeditor'==$(this).attr('editorType')) {
                        CKEDITOR.instances[$(this).data("id")].destroy();
                    } else if("kindeditor"==$(this).attr("editorType")) {
                        KindEditor.remove('#'+$(this).data("id"));
                    } else {
                        UE.instants[$(this).data("id")].destroy();
                    }
                });
                $("textarea.code", $(box)).each(function() {
                    delete DWZ.instances[$(this).data("id")];
                });
                $(".image-editor", $(box)).each(function() {
                    DWZ.instances[$(this).data("id")].destroy();
                    delete DWZ.instances[$(this).data("id")];
                });
                $('[close-url]',$(box)).each(function (){
                    $.getJSON($(this).attr("close-url"), function(data) {});
                });
            });
        }
    }
};

( function($) {
    // DWZ set regional
    $.setRegional = function(key, value) {
        if (!$.regional ) {
            $.regional = {};
        }
        $.regional[key] = value;
    };

    // DWZ set msg
    $.setMessage = function(key, value) {
        DWZ._msg[key] = value;
    };

    $.fn.extend({
        /**
         * @param {Object}
         *            op: {type:GET/POST, url:ajax请求地址, data:ajax请求参数列表,
         *            callback:回调函数 }
         */
        ajaxUrl: function(op) {
            var $this = $(this);
            $this.trigger(DWZ.eventType.pageClear);
            $.ajax({
                type: op.type || 'GET', url: op.url, data: op.data, cache: false, success: function(response) {
                    var json = DWZ.jsonEval(response);
                    if (json[DWZ.keys.statusCode] == DWZ.statusCode.error ) {
                        if (json[DWZ.keys.message] ) {
                            alertMsg.error(json[DWZ.keys.message]);
                        }
                    } else if (json[DWZ.keys.statusCode] == DWZ.statusCode.timeout ) {
                        $this.html(response);
                        if ($.pdialog ) {
                            $.pdialog.checkTimeout();
                        }
                        if (navTab ) {
                            navTab.checkTimeout();
                        }
                        alertMsg.error(json[DWZ.keys.message] || DWZ.msg("sessionTimout"), {
                            okCall: function() {
                                DWZ.loadLogin();
                            }
                        });
                    } else {
                        $this.html(response).initUI();
                        if ($.isFunction(op.callback) ) {
                            op.callback(response);
                        }
                    }
                },
                error: DWZ.ajaxError, statusCode: {
                    503: function(xhr, ajaxOptions, thrownError) {
                        alert(DWZ.msg("statusCode_503") || thrownError);
                    }
                }
            });
        },
        loadUrl: function(url, data, callback) {
            $(this).ajaxUrl({
                url: url, data: data, callback: callback
            });
        },
        initUI: function() {
            return this.each(function() {
                if ($.isFunction(initUI) ) {
                    initUI(this);
                }
            });
        },
        /**
         * adjust component inner reference box height
         *
         * @param {Object}
         *            refBox: reference box jQuery Obj
         */
        layoutH: function($refBox) {
            return this.each(function() {
                var $this = $(this);
                if (!$refBox ) {
                    $refBox = $this.parents("div.layoutBox:first");
                }
                var iRefH = $refBox.height();

                var iLayoutH = 0;
                if ($this.parents('.rightPageContent').length != 0){
                    iLayoutH = $this.getSiblingsElemsH($this.parents('.rightPageContent'));
                }else if ($this.parents('.pageFormContent').length != 0){
                    iLayoutH = $this.getSiblingsElemsH($this.parents('.pageFormContent')) + 30;
                }else if ($this.parents('.page').length != 0 ) {
                    iLayoutH = $this.getSiblingsElemsH($this.parents('.page'));
                }else if ($this.parents('.dialogContent').length != 0){
                    iLayoutH = $this.getSiblingsElemsH($this.parents('.dialogContent'));
                }

                var iH = iRefH - iLayoutH > 50 ? iRefH - iLayoutH: 50;
                if ($this.isTag("table") ) {
                    $this.removeAttr("layoutH").wrap('<div layoutH="' + iLayoutH + '" style="overflow:auto;height:' + iH + 'px"></div>');
                } else {
                    $this.outerHeight(iH).css("overflow", "auto");
                }
            });
        },
        /**
         * 获取page中的其他元素的总高度
         */
        getSiblingsElemsH: function($container) {
            var height = 0;
            var $page = $container;
            var headerH = this.getElemsH($page, '.pageHeader');
            var formBarH = this.getElemsH($page, '.formBar');
            var contentTitleH = this.getElemsH($page, '.contentTitle');
            var gridHeaderH = this.getElemsH($page, '.gridHeader');
            var tabsHeaderH = this.getElemsH($page, '.tabsHeader');
            var pageBarH = this.getElemsH($page, '.pageBar.panelBar');
            var panelBarH = this.getElemsH($page, '.panelBar:not(.pageBar)');
            height = headerH + pageBarH + gridHeaderH + panelBarH + formBarH + tabsHeaderH + contentTitleH;
            return height;
        },
        /**
         * 获取元素高度
         * @param $container 总容器
         * @param elem    当前元素的jquery选择的字符串
         */
        getElemsH: function($container, elem){
            var h = 0;
            var $elem = $container.find(elem);
            var isSilbinsElem = true;
            if($elem.length != 0){
                if(this.find(elem).length == 0){
                    var $silbingsElems = this.siblings();
                    for(var i=0;i<$silbingsElems.length;i++){
                        if($silbingsElems.eq(i).find(elem).length != 0){
                            isSilbinsElem = false;
                            break;
                        }
                    }
                    if(isSilbinsElem){
                        h = $elem.outerHeight(true);
                    }
                }
            }
            return h;
        },
        inputAlert: function() {
            return this.each(function() {
                var $this = $(this);
                function getAltBox() {
                    return $this.parent().find("label.alt");
                }
                function altBoxCss(opacity) {
                    var position = $this.position();
                    return {
                        width: $this.width(), top: position.top + 'px', left: position.left + 'px', opacity: opacity || 1
                    };
                }
                if (getAltBox().size() < 1 ) {
                    if (!$this.attr("id") ) {
                        $this.attr("id", $this.attr("name") + "_" + Math.round(Math.random() * 10000));
                    }
                    var $label = $('<label class="alt" for="' + $this.attr("id") + '">' + $this.attr("alt") + '</label>').appendTo($this.parent());
                    $label.css(altBoxCss(0.6));
                    if ($this.val() ) {
                        $label.hide();
                    }
                }
                $this.focus(function() {
                    getAltBox().css(altBoxCss(0.3));
                }).blur(function() {
                    if (!$(this).val() ) {
                        getAltBox().show().css("opacity", 1);
                    }
                }).keydown(function() {
                    getAltBox().hide();
                });
            });
        },
        isTag: function(tn) {
            if (!tn || undefined == $(this)[0] ) {
                return false;
            }
            return $(this)[0].tagName.toLowerCase() == tn ? true: false;
        },
        /**
         * 判断当前元素是否已经绑定某个事件
         *
         * @param {Object}
         *            type
         */
        isBind: function(type) {
            var _events = $(this).data("events");
            return _events && type && _events[type];
        },
        /**
         * 输出firebug日志
         *
         * @param {Object}
         *            msg
         */
        log: function(msg) {
            return this.each(function() {
                if (console ) {
                    console.log("%s: %o", msg, this);
                }
            });
        }
    });

    /**
     * 扩展String方法
     */
    $.extend(String.prototype, {
        isPositiveInteger: function() {
            return ( new RegExp(/^[1-9]\d*$/).test(this) );
        },
        isInteger: function() {
            return (new RegExp(/^\d+$/).test(this));
        },
        isNumber: function(value, element) {
            return (new RegExp(/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/).test(this));
        },
        trim: function() {
            return this.replace(/(^\s*)|(\s*$)|\r|\n/g, "");
        },
        startsWith: function(pattern) {
            return this.indexOf(pattern) === 0;
        },
        endsWith: function(pattern) {
            var d = this.length - pattern.length;
            return d >= 0 && this.lastIndexOf(pattern) === d;
        },
        replaceSuffix: function(index) {
            return this.replace(/\[[0-9]+\]/, "[" + index + "]").replace("#index#", index);
        },
        trans: function() {
            return this.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
        },
        encodeTXT: function() {
            return (this).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(" ", "&nbsp;");
        },
        replaceAll: function(os, ns) {
            return this.replace(new RegExp(os, "gm"), ns);
        },
        replaceTm: function(data) {
            if (!data) {
                return this;
            }
            return this.replace(RegExp("({[A-Za-z_]+[A-Za-z0-9_]*})", "g"), function($1) {
                return data[$1.replace(/[{}]+/g, "")];
            })
        },
        replaceTmById: function(_box) {
            var $parent = _box || $(document);
            return this.replace(RegExp("({[A-Za-z_]+[A-Za-z0-9_]*})", "g"), function($1) {
                var $input = $parent.find("#" + $1.replace(/[{}]+/g, ""));
                return $input.val() ? $input.val(): $1;
            });
        },
        isFinishedTm: function() {
            return ! ( new RegExp("{[A-Za-z_]+[A-Za-z0-9_]*}").test(this) );
        },
        skipChar: function(ch) {
            if (!this || this.length === 0) {
                return "";
            }
            if (this.charAt(0) === ch) {
                return this.substring(1).skipChar(ch);
            }
            return this;
        },
        isValidPwd: function() {
            return (new RegExp(/^([_]|[a-zA-Z0-9]){6,32}$/).test(this));
        },
        isValidMail: function() {
            return (new RegExp(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/).test(this.trim()));
        },
        isSpaces: function() {
            for (var i = 0; i < this.length; i += 1) {
                var ch = this.charAt(i);
                if (ch != " " && ch != "\n" && ch != "\t" && ch != "\r") {
                    return fals;
                }
            }
            return true;
        },
        isPhone: function() {
            return (new RegExp(/(^([0-9]{3,4}[-])?\d{3,8}(-\d{1,6})?$)|(^\([0-9]{3,4}\)\d{3,8}(\(\d{1,6}\))?$)|(^\d{3,8}$)/).test(this));
        },
        isUrl: function() {
            return ( new RegExp(/^([a-zA-z]+:)?\/\/([a-zA-Z0-9\-\.]+)([-\w .\/?%&=:]*)$/).test(this) );
        },
        isExternalUrl: function() {
            var domain = document.domain;
            if("" == domain){
                domain = "localhost";
            }
            return this.isUrl() && this.indexOf("//" + domain) == -1;
        }
    });
} )(jQuery);

/**
 * You can use this map like this: var myMap = new Map();
 * myMap.put("key","value"); var key = myMap.get("key"); myMap.remove("key");
 */
function Map() {
    this.elements = new Array();
    this.size = function() {
        return this.elements.length;
    }
    this.isEmpty = function() {
        return ( this.elements.length < 1 );
    }
    this.clear = function() {
        this.elements = new Array();
    }
    this.put = function(_key, _value) {
        this.remove(_key);
        this.elements.push({
            key: _key, value: _value
        });
    }
    this.remove = function(_key) {
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key ) {
                    this.elements.splice(i, 1);
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }
    this.get = function(_key) {
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key ) {
                    return this.elements[i].value;
                }
            }
        } catch (e) {
            return null;
        }
    }
    this.element = function(_index) {
        if (_index < 0 || _index >= this.elements.length ) {
            return null;
        }
        return this.elements[_index];
    }
    this.containsKey = function(_key) {
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key ) {
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }
    this.values = function() {
        var arr = new Array();
        for (i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].value);
        }
        return arr;
    }
    this.keys = function() {
        var arr = new Array();
        for (i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].key);
        }
        return arr;
    }
}
/**
 * @author ZhangHuihua@msn.com
 *         ---------------------------------------------------------- These
 *         functions use the same 'format' strings as the
 *         java.text.SimpleDateFormat class, with minor exceptions. The format
 *         string consists of the following abbreviations: Field | Full Form |
 *         Short Form -------------+--------------------+-----------------------
 *         Year | yyyy (4 digits) | yy (2 digits), y (2 or 4 digits) Month | MMM
 *         (name or abbr.)| MM (2 digits), M (1 or 2 digits) | NNN (abbr.) | Day
 *         of Month | dd (2 digits) | d (1 or 2 digits) Day of Week | EE (name) |
 *         E (abbr) Hour (1-12) | hh (2 digits) | h (1 or 2 digits) Hour (0-23) |
 *         HH (2 digits) | H (1 or 2 digits) Hour (0-11) | KK (2 digits) | K (1
 *         or 2 digits) Hour (1-24) | kk (2 digits) | k (1 or 2 digits) Minute |
 *         mm (2 digits) | m (1 or 2 digits) Second | ss (2 digits) | s (1 or 2
 *         digits) AM/PM | a | NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM,
 *         not mm! Examples: "MMM d, y" matches: January 01, 2000 Dec 1, 1970
 *         Nov 20, 00 "M/d/yy" matches: 01/20/00 9/2/00 "MMM dd, yyyy hh:mm:ssa"
 *         matches: "January 01, 2000 12:30:45AM"
 *         ----------------------------------------------------------
 */
( function() {
    var MONTH_NAMES = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar',
        'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
    var DAY_NAMES = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
    function LZ(x) {
        return ( x < 0 || x > 9 ? "": "0" ) + x
    }

    /**
     * formatDate (date_object, format) Returns a date in the output format
     * specified. The format string uses the same abbreviations as in
     * parseDate()
     *
     * @param {Object}
     *            date
     * @param {Object}
     *            format
     */
    function formatDate(date, format) {
        format = format + "";
        var result = "";
        var i_format = 0;
        var c = "";
        var token = "";
        var y = date.getYear() + "";
        var M = date.getMonth() + 1;
        var d = date.getDate();
        var E = date.getDay();
        var H = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        var yyyy, yy, MMM, MM, dd, hh, h, mm, ss, ampm, HH, H, KK, K, kk, k;
        // Convert real date parts into formatted versions
        var value = {};
        if (y.length < 4 ) {
            y = "" + ( y - 0 + 1900 );
        }
        value.y = "" + y;
        value.yyyy = y;
        value.yy = y.substring(2, 4);
        value.M = M;
        value.MM = LZ(M);
        value.MMM = MONTH_NAMES[M - 1];
        value.NNN = MONTH_NAMES[M + 11];
        value.d = d;
        value.dd = LZ(d);
        value.E = DAY_NAMES[E + 7];
        value.EE = DAY_NAMES[E];
        value.H = H;
        value.HH = LZ(H);
        if (H == 0 ) {
            value.h = 12;
        } else {
            if (H > 12) {
                value.h = H - 12;
            } else {
                value.h = H;
            }

        }
        value.hh = LZ(value.h);
        if (H > 11 ) {
            value.K = H - 12;
        } else {
            value.K = H;
        }
        value.k = H + 1;
        value.KK = LZ(value.K);
        value.kk = LZ(value.k);
        if (H > 11 ) {
            value.a = "PM";
        } else {
            value.a = "AM";
        }
        value.m = m;
        value.mm = LZ(m);
        value.s = s;
        value.ss = LZ(s);
        while (i_format < format.length) {
            c = format.charAt(i_format);
            token = "";
            while ( ( format.charAt(i_format) == c ) && ( i_format < format.length )) {
                token += format.charAt(i_format++);
            }
            if (value[token] != null ) {
                result += value[token];
            } else {
                result += token;
            }
        }
        return result;
    }
    function _isInteger(val) {
        return ( new RegExp(/^\d+$/).test(val) );
    }
    function _getInt(str, i, minlength, maxlength) {
        for (var x = maxlength; x >= minlength; x--) {
            var token = str.substring(i, i + x);
            if (token.length < minlength ) {
                return null;
            }
            if (_isInteger(token) ) {
                return token;
            }
        }
        return null;
    }

    /**
     * parseDate( date_string, format_string ) This function takes a date string
     * and a format string. It matches If the date string matches the format
     * string, it returns the date. If it does not match, it returns 0.
     *
     * @param {Object}
     *            val
     * @param {Object}
     *            format
     */
    function parseDate(val, format) {
        val = val + "";
        format = format + "";
        var i_val = 0;
        var i_format = 0;
        var c = "";
        var token = "";
        var token2 = "";
        var x, y;
        var now = new Date(1970, 0, 1);
        var year = now.getYear();
        var month = now.getMonth() + 1;
        var date = 1;
        var hh = now.getHours();
        var mm = now.getMinutes();
        var ss = now.getSeconds();
        var ampm = "";
        while (i_format < format.length) {
            // Get next token from format string
            c = format.charAt(i_format);
            token = "";
            while ( ( format.charAt(i_format) == c ) && ( i_format < format.length )) {
                token += format.charAt(i_format++);
            }
            // Extract contents of value based on format token
            if (token == "yyyy" || token == "yy" || token == "y" ) {
                if (token == "yyyy" ) {
                    x = 4;
                    y = 4;
                }
                if (token == "yy" ) {
                    x = 2;
                    y = 2;
                }
                if (token == "y" ) {
                    x = 2;
                    y = 4;
                }
                year = _getInt(val, i_val, x, y);
                if (year == null ) {
                    return 0;
                }
                i_val += year.length;
                if (year.length == 2 ) {
                    if (year > 70 ) {
                        year = 1900 + ( year - 0 );
                    } else {
                        year = 2000 + ( year - 0 );
                    }
                }
            } else if (token == "MMM" || token == "NNN" ) {
                month = 0;
                for (var i = 0; i < MONTH_NAMES.length; i++) {
                    var month_name = MONTH_NAMES[i];
                    if (val.substring(i_val, i_val + month_name.length).toLowerCase() == month_name.toLowerCase() ) {
                        if (token == "MMM" || ( token == "NNN" && i > 11 ) ) {
                            month = i + 1;
                            if (month > 12 ) {
                                month -= 12;
                            }
                            i_val += month_name.length;
                            break;
                        }
                    }
                }
                if ( ( month < 1 ) || ( month > 12 ) ) {
                    return 0;
                }
            } else if (token == "EE" || token == "E" ) {
                for (var i = 0; i < DAY_NAMES.length; i++) {
                    var day_name = DAY_NAMES[i];
                    if (val.substring(i_val, i_val + day_name.length).toLowerCase() == day_name.toLowerCase() ) {
                        i_val += day_name.length;
                        break;
                    }
                }
            } else if (token == "MM" || token == "M" ) {
                month = _getInt(val, i_val, token.length, 2);
                if (month == null || ( month < 1 ) || ( month > 12 ) ) {
                    return 0;
                }
                i_val += month.length;
            } else if (token == "dd" || token == "d" ) {
                date = _getInt(val, i_val, token.length, 2);
                if (date == null || ( date < 1 ) || ( date > 31 ) ) {
                    return 0;
                }
                i_val += date.length;
            } else if (token == "hh" || token == "h" ) {
                hh = _getInt(val, i_val, token.length, 2);
                if (hh == null || ( hh < 1 ) || ( hh > 12 ) ) {
                    return 0;
                }
                i_val += hh.length;
            } else if (token == "HH" || token == "H" ) {
                hh = _getInt(val, i_val, token.length, 2);
                if (hh == null || ( hh < 0 ) || ( hh > 23 ) ) {
                    return 0;
                }
                i_val += hh.length;
            } else if (token == "KK" || token == "K" ) {
                hh = _getInt(val, i_val, token.length, 2);
                if (hh == null || ( hh < 0 ) || ( hh > 11 ) ) {
                    return 0;
                }
                i_val += hh.length;
            } else if (token == "kk" || token == "k" ) {
                hh = _getInt(val, i_val, token.length, 2);
                if (hh == null || ( hh < 1 ) || ( hh > 24 ) ) {
                    return 0;
                }
                i_val += hh.length;
                hh--;
            } else if (token == "mm" || token == "m" ) {
                mm = _getInt(val, i_val, token.length, 2);
                if (mm == null || ( mm < 0 ) || ( mm > 59 ) ) {
                    return 0;
                }
                i_val += mm.length;
            } else if (token == "ss" || token == "s" ) {
                ss = _getInt(val, i_val, token.length, 2);
                if (ss == null || ( ss < 0 ) || ( ss > 59 ) ) {
                    return 0;
                }
                i_val += ss.length;
            } else if (token == "a" ) {
                if (val.substring(i_val, i_val + 2).toLowerCase() == "am" ) {
                    ampm = "AM";
                } else if (val.substring(i_val, i_val + 2).toLowerCase() == "pm" ) {
                    ampm = "PM";
                } else {
                    return 0;
                }
                i_val += 2;
            } else {
                if (val.substring(i_val, i_val + token.length) != token ) {
                    return 0;
                } else {
                    i_val += token.length;
                }
            }
        }
        // If there are any trailing characters left in the value, it doesn't
        // match
        if (i_val != val.length ) {
            return 0;
        }
        // Is date valid for month?
        if (month == 2 ) {
            // Check for leap year
            if ( ( ( year % 4 == 0 ) && ( year % 100 != 0 ) ) || ( year % 400 == 0 ) ) { // leap
                // year
                if (date > 29 ) {
                    return 0;
                }
            } else {
                if (date > 28 ) {
                    return 0;
                }
            }
        }
        if ( ( month == 4 ) || ( month == 6 ) || ( month == 9 ) || ( month == 11 ) ) {
            if (date > 30 ) {
                return 0;
            }
        }
        // Correct hours value
        if (hh < 12 && ampm == "PM" ) {
            hh = hh - 0 + 12;
        } else if (hh > 11 && ampm == "AM" ) {
            hh -= 12;
        }
        return new Date(year, month - 1, date, hh, mm, ss);
    }
    Date.prototype.formatDate = function(dateFmt) {
        return formatDate(this, dateFmt);
    };
    String.prototype.parseDate = function(dateFmt) {
        if (this.length < dateFmt.length ) {
            dateFmt = dateFmt.slice(0, this.length);
        }
        return parseDate(this, dateFmt);
    };

    /**
     * replaceTmEval("{1+2}-{2-1}")
     */
    function replaceTmEval(data) {
        return data.replace(RegExp("({[A-Za-z0-9_+-]*})", "g"), function($1) {
            return eval('(' + $1.replace(/[{}]+/g, "") + ')');
        });
    }
    /**
     * dateFmt:%y-%M-%d %y-%M-{%d+1} ex: new Date().formatDateTm('%y-%M-{%d-1}')
     * new Date().formatDateTm('2012-1')
     */
    Date.prototype.formatDateTm = function(dateFmt) {
        var y = this.getFullYear();
        var m = this.getMonth() + 1;
        var d = this.getDate();
        var sDate = dateFmt.replaceAll("%y", y).replaceAll("%M", m).replaceAll("%d", d);
        sDate = replaceTmEval(sDate);
        var _y = 1970, _m = 0, _d = 1;
        var aDate = sDate.split("-");
        if (aDate.length > 0 ) {
            _y = aDate[0];
        }
        if (aDate.length > 1 ) {
            _m = aDate[1] - 1;
        }
        if (aDate.length > 2 ) {
            _d = aDate[2];
        }
        return new Date(_y, _m, _d).formatDate('yyyy-MM-dd');
    };
} )();

/**
 * @requires jquery.validate.js
 * @author ZhangHuihua@msn.com
 */
( function($) {
    if ($.validator ) {
        $.validator.addMethod("alphanumeric", function(value, element) {
            return this.optional(element) || /^\w+$/i.test(value);
        }, "Letters, numbers or underscores only please");
        $.validator.addMethod("lettersonly", function(value, element) {
            return this.optional(element) || /^[a-z]+$/i.test(value);
        }, "Letters only please");
        $.validator.addMethod("letterstart", function(value, element) {
            return this.optional(element) || /^[a-z]+\w+$/i.test(value);
        }, "Letters, numbers or underscores only  please,The first character must be letter");
        $.validator.addMethod("phone", function(value, element) {
            return this.optional(element) || /^[0-9 \(\)]{7,30}$/.test(value);
        }, "Please specify a valid phone number");
        $.validator.addMethod("postcode", function(value, element) {
            return this.optional(element) || /^[0-9 A-Za-z]{5,20}$/.test(value);
        }, "Please specify a valid postcode");
        $.validator.addMethod("domain", function(value, element) {
            return this.optional(element) || /^((((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(\[?((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\]?)|(localhost)|(loopback)|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)*)?$/i.test(value);
        }, "Please specify a valid domain");
        $.validator.addMethod("date", function(value, element) {
            value = value.replace(/\s+/g, "");
            if (String.prototype.parseDate ) {
                var $input = $(element);
                var pattern = $input.attr('dateFmt') || 'yyyy-MM-dd';
                return !$input.val() || $input.val().parseDate(pattern);
            } else {
                return this.optional(element) || value.match(/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/);
            }
        }, "Please enter a valid date.");

        /*
         * 自定义js函数验证 <input type="text" name="xxx" customvalid="xxxFn(element)"
         * title="xxx" />
         */
        $.validator.addMethod("customvalid", function(value, element, params) {
            try {
                return eval('(' + params + ')');
            } catch (e) {
                return false;
            }
        }, "Please fix this field.");
        $.validator.addClassRules({
            date: {
                date: true
            }, alphanumeric: {
                alphanumeric: true
            }, lettersonly: {
                lettersonly: true
            }, phone: {
                phone: true
            }, postcode: {
                postcode: true
            }
        });
        $.validator.setDefaults({
            errorElement: "span"
        });
        $.validator.autoCreateRanges = true;
    }

} )(jQuery);
/**
 * @author Roger Wu
 * @version 1.0
 */
( function($) {
    $.fn.cssv = function(pre) {
        var cssPre = $(this).css(pre);
        return cssPre.substring(0, cssPre.indexOf("px")) * 1;
    };
    $.fn.jBar = function(options) {
        var op = $.extend({
            container: "#navTab",containerHeader: "#navTab .tabsPageHeader", toggleBut: ".toggleCollapse", sideBar: "#sidebar", sideBar2: "#sidebar_s", splitBar: "#splitBar",
            splitBar2: "#splitBarProxy", iconClass: "icon-chevron-sign-right"
        }, options);
        return this.each(function() {
            var jbar = this;
            var sbar = $(op.sideBar2, jbar);
            var bar = $(op.sideBar, jbar);
            $(op.toggleBut).click(function() {
                if($(op.splitBar).is(':visible')){
                    DWZ.ui.sbar = false;
                    $('.icon',op.toggleBut).addClass(op.iconClass);
                    $(op.splitBar).hide();
                    var barleft = sbar.outerWidth() - bar.outerWidth();
                    var cleft = $(op.container).cssv("margin-left") - bar.outerWidth();
                    var cwidth = bar.outerWidth() + $(op.container).outerWidth();
                    $(op.containerHeader).animate({
                        'margin-left': sbar.outerWidth()
                    },50);
                    sbar.show().css("left", 0);
                    $(op.container).animate({
                        'margin-left': cleft, width: cwidth
                    }, 50, function() {
                        bar.animate({
                            left: barleft,
                            top: sbar.outerHeight()
                        }, 50, function() {
                            bar.hide();
                            bar.css("bottom","auto");
                            $(window).trigger(DWZ.eventType.resizeGrid);
                        });
                    });
                    $(sbar).click(function() {
                        if (bar.is(":hidden") ) {
                            bar.show().animate({
                                left: 0
                            }, 50);
                            $(op.container).click(_hideBar);
                        } else {
                            bar.animate({
                                left: barleft
                            }, 50, function() {
                                bar.hide();
                            });
                        }
                        function _hideBar() {
                            $(op.container).unbind("click", _hideBar);
                            if (!DWZ.ui.sbar ) {
                                bar.animate({
                                    left: barleft
                                }, 50, function() {
                                    bar.hide();
                                });
                            }
                        }
                        return false;
                    });
                }else{
                    DWZ.ui.sbar = true;
                    $('.icon',op.toggleBut).removeClass(op.iconClass);
                    sbar.css('left', -50);
                    $(op.containerHeader).animate({
                        'margin-left': 0
                    }, 80);
                    bar.show().css('bottom',0).css('top',0).animate({
                        left: 0
                    }, 80, function() {
                        $(op.splitBar).show();
                        var cleft = bar.outerWidth();
                        var cwidth = $(op.container).outerWidth() - ( cleft - $(op.container).cssv("margin-left") );
                        $(op.container).css({
                            'margin-left': cleft, width: cwidth
                        });
                        $(sbar).unbind('click');
                        $(window).trigger(DWZ.eventType.resizeGrid);
                    });
                }
                return false;
            });
            $(op.splitBar).mousedown(function(event) {
                $(op.splitBar2).each(function() {
                    var spbar2 = $(this);
                    setTimeout(function() {
                        spbar2.show();
                    }, 10);
                    spbar2.css({
                        visibility: "visible", left: $(op.splitBar).css("left")
                    });
                    spbar2.jDrag($.extend(options, {
                        obj: $("#sidebar"), move: "horizontal", event: event, stop: function() {
                            $(this).css("visibility", "hidden");
                            var move = $(this).cssv("left") - $(op.splitBar).cssv("left");
                            var sbarwidth = bar.outerWidth() + move;
                            var cleft = $(op.container).cssv("margin-left") + move;
                            var cwidth = $(op.container).outerWidth() - move - 1;
                            bar.css("width", sbarwidth);
                            $(op.splitBar).css("left", $(this).css("left"));
                            $(op.container).css({
                                'margin-left': cleft, width: cwidth
                            });
                        }
                    }));
                    return false;
                });
            });
        });
    }
} )(jQuery);
/**
 * @author Roger Wu
 */
( function($) {
    $.scrollPosParents = function(el){
        var $el = $(el);
        // var scrollPos = {top:$el.scrollTop(), left:$el.scrollLeft()};
        var scrollPos = {top:0, left:0};
        $el.parents().each(function(){
            var $p = $(this);
            scrollPos.top += $p.scrollTop();
            scrollPos.left += $p.scrollLeft();
        });
        return scrollPos;
    };

    $.fn.jDrag = function(options) {
        if (typeof options == 'string' ) {
            if (options == 'destroy' ) {
                return this.each(function() {
                    $(this).unbind('mousedown', $.rwdrag.start);
                    $.data(this, 'pp-rwdrag', null);
                });
            }
        }
        return this.each(function() {
            var el = $(this);
            $.data($.rwdrag, 'pp-rwdrag', {
                options: $.extend({
                    el: el, obj: el
                }, options)
            });
            if (options.event ) {
                $.rwdrag.start(options.event);
            } else {
                var select = options.selector;
                $(select, obj).bind('mousedown', $.rwdrag.start);
            }
        });
    };
    $.rwdrag = {
        start: function(e) {
            var data = $.data(this, 'pp-rwdrag');
            var el = data.options.el[0];
            $.data(el, 'pp-rwdrag', {
                options: data.options
            });
            if (!$.rwdrag.current ) {
                $.rwdrag.current = {
                    el: el, oleft: parseInt(el.style.left) || 0, otop: parseInt(el.style.top) || 0, ox: e.pageX || e.screenX, oy: e.pageY || e.screenY
                };
                $(document).bind("mouseup", $.rwdrag.stop).bind("mousemove", $.rwdrag.drag);
            }
        },
        drag: function(e) {
            if (!e ) {
                var e = window.event;
            }
            var current = $.rwdrag.current;
            var data = $.data(current.el, 'pp-rwdrag');
            var left = ( current.oleft + ( e.pageX || e.clientX ) - current.ox );
            var top = ( current.otop + ( e.pageY || e.clientY ) - current.oy );
            if (data.options.move == 'horizontal' ) {
                if ( ( data.options.minW && left >= $(data.options.obj).cssv("left") + data.options.minW )
                        && ( data.options.maxW && left <= $(data.options.obj).cssv("left") + data.options.maxW ) ) {
                    current.el.style.left = left + 'px';
                } else if (data.options.scop ) {
                    if (data.options.relObj ) {
                        if ( ( left - parseInt(data.options.relObj.style.left) ) > data.options.cellMinW ) {
                            current.el.style.left = left + 'px';
                        }
                    } else {
                        current.el.style.left = left + 'px';
                    }
                }
            } else if (data.options.move == 'vertical' ) {
                current.el.style.top = top + 'px';
            } else {
                var selector = data.options.selector ? $(data.options.selector, data.options.obj): $(data.options.obj);
                if (left >= -selector.outerWidth() * 2 / 3 && ( left + selector.outerWidth() / 3 < $(window).width() )
                        && ( top + selector.outerHeight() < $(window).height() ) ) {
                    current.el.style.left = left + 'px';
                    current.el.style.top = top + 'px';
                }
            }
            if (data.options.drag ) {
                data.options.drag.apply(current.el, [ current.el, e ]);
            }
            return $.rwdrag.preventEvent(e);
        }, stop: function(e) {
            var current = $.rwdrag.current;
            var data = $.data(current.el, 'pp-rwdrag');
            $(document).unbind('mousemove', $.rwdrag.drag).unbind('mouseup', $.rwdrag.stop);
            if (data.options.stop ) {
                data.options.stop.apply(current.el, [ current.el, e ]);
            }
            $.rwdrag.current = null;
            return $.rwdrag.preventEvent(e);
        }, preventEvent: function(e) {
            if (e.stopPropagation ) {
                e.stopPropagation();
            }
            if (e.preventDefault ) {
                e.preventDefault();
            }
            return false;
        }
    };
} )(jQuery);
/**
 * @author Roger Wu
 * @version 1.0 added extend property oncheck
 */
( function($) {
    $.extend($.fn, {
        jTree: function(options) {
            var op = $.extend({
                checkFn: null, selected: "selected", exp: "expandable", coll: "collapsable", firstExp: "first_expandable", firstColl: "first_collapsable",
                lastExp: "last_expandable", lastColl: "last_collapsable", folderExp: "folder_expandable", folderColl: "folder_collapsable", endExp: "end_expandable",
                endColl: "end_collapsable", file: "file", ck: "checked", unck: "unchecked", async: "_src"
            }, options);
            return this.each(function() {
                var $this = $(this);
                var cnum = $this.children().length;
                $(">li", $this).each(function() {
                    var $li = $(this);
                    var first = $li.prev()[0] ? false: true;
                    var last = $li.next()[0] ? false: true;
                    $li.genTree({
                        root: $this,
                        icon: $this.hasClass("treeFolder"), ckbox: $this.hasClass("treeCheck") , excludeParent:  $this.hasClass("excludeParent"), options: op, level: 0,
                        exp: ( cnum > 1 ? ( first ? op.firstExp: ( last ? op.lastExp: op.exp ) ): op.endExp ),
                        coll: ( cnum > 1 ? ( first ? op.firstColl: ( last ? op.lastColl: op.coll ) ): op.endColl ),
                        showSub: ( !$this.hasClass("collapse") && ( $this.hasClass("expand") || ( cnum > 1 ? false : true ) ) ),
                        isLast: ( cnum > 1 ? ( last ? true: false ): true )
                    });
                });
                setTimeout(function() {
                    if ($this.hasClass("treeCheck") ) {
                        var checkFn = eval($this.attr("oncheck"));
                        if (checkFn && $.isFunction(checkFn) ) {
                            $("div.ckbox", $this).each(function() {
                                var ckbox = $(this);
                                ckbox.click(function() {
                                    var checked = $(ckbox).hasClass("checked");
                                    var items = [ ];
                                    if (checked ) {
                                        var tnode = $(ckbox).parent().parent();
                                        var boxes = $("input", tnode);
                                        if (boxes.size() > 1 ) {
                                            $(boxes).each(function() {
                                                items[items.length] = {
                                                    name: $(this).attr("name"), value: $(this).val()
                                                };
                                            });
                                        } else {
                                            items = {
                                                name: boxes.attr("name"), value: boxes.val()
                                            };
                                        }
                                    }
                                    checkFn({
                                        checked: checked, items: items
                                    });
                                    return false;
                                });
                            });
                        }
                    }
                    $("a", $this).click(function(event) {
                        $("div." + op.selected, $this).removeClass(op.selected);
                        var parent = $(this).parent().addClass(op.selected);
                        var $li = $(this).parents("li:first"), sTarget = $li.attr("target");
                        if (sTarget ) {
                            if ($("#" + sTarget, $this).size() == 0 ) {
                                $this.prepend('<input id="' + sTarget + '" type="hidden" />');
                            }
                            $("#" + sTarget, $this).val($li.attr("rel"));
                        }
                        $(".ckbox", parent).trigger("click");
                        event.stopPropagation();
                        $(document).trigger("click");
                        if (!$(this).attr("target") ) {
                            return false;
                        }
                    });
                }, 1);
            });
        },
        subTree: function(op, level) {
            return this.each(function() {
                $(">li", this).each(function() {
                    var $this = $(this);
                    var isLast = ( $this.next()[0] ? false: true );
                    $this.genTree({
                        root: op.root, icon: op.icon, ckbox: op.ckbox, excludeParent: op.excludeParent, exp: isLast ? op.options.lastExp: op.options.exp, coll: isLast ? op.options.lastColl: op.options.coll,
                        options: op.options, level: level, space: isLast ? null: op.space, showSub: op.showSub, isLast: isLast
                    });
                });
            });
        },
        genTree: function(options) {
            var op = $.extend({
                root: options.root, icon: options.icon, ckbox: options.ckbox, excludeParent: options.excludeParent, exp: "", coll: "", showSub: false, level: 0, options: null, isLast: false
            }, options);
            return this.each(function() {
                var node = $(this);
                var tree = $(">ul", node);
                var parent = node.parent().prev();
                var checked = 'unchecked';
                if (op.ckbox && 0 > $(">.checked", parent).size() ) {
                    checked = 'checked';
                }
                if (tree.size() > 0 || node.attr(op.options.async)) {
                    node.children(":first").wrap("<div></div>");
                    $(">div", node).prepend(( op.ckbox ? "<div class='ckbox " + checked + "'></div>": "" )
                            + ( op.icon ? "<div class='" + ( ( op.showSub  && !node.attr(op.options.async) )  ? op.options.folderColl: op.options.folderExp ) + "'></div>": "<div class='" + ( ( op.showSub && !node.attr(op.options.async) ) ? op.coll: op.exp ) + "'></div>" ));
                    if (tree.size() > 0 ) {
                        op.showSub ? tree.show(): tree.hide();
                    }
                    $(">div>div."+op.options.folderColl+",>div>div."+op.options.folderExp+",>div>a", node).click(function() {
                        if(node.attr(op.options.async)){
                            $.ajax({
                                type: 'get', url: node.attr(op.options.async), async: false, data: {}, success: function(response){
                                    node.append(response);
                                    tree = $(">ul", node).hide();
                                    initLink(tree);
                                    $("a", tree).click(function(event) {
                                        $("div." + op.options.selected, op.root).removeClass(op.options.selected);
                                        var parent = $(this).parent().addClass(op.options.selected);
                                        var $li = $(this).parents("li:first"), sTarget = $li.attr("target");
                                        if (sTarget ) {
                                            if ($("#" + sTarget, op.root).size() == 0 ) {
                                                op.root.prepend('<input id="' + sTarget + '" type="hidden" />');
                                            }
                                            $("#" + sTarget, op.root).val($li.attr("rel"));
                                        }
                                        $(".ckbox", parent).trigger("click");
                                        event.stopPropagation();
                                        $(document).trigger("click");
                                        if (!$(this).attr("target") ) {
                                            return false;
                                        }
                                    });
                                    node.removeAttr(op.options.async);
                                },error: DWZ.ajaxError
                            });
                            if(node.attr(op.options.async) ){
                                return false;
                            }
                        }
                        var $fnode = $(">li:first", tree);
                        if ($fnode.children(":first").isTag('a') ) {
                            tree.subTree(op, op.level + 1);
                        }
                        var isA = $(this).isTag('a');
                        var $this = $(">div>div."+op.coll+",>div>div."+op.exp, node);
                        if (!isA || tree.is(":hidden") ) {
                            $this.toggleClass(op.exp).toggleClass(op.coll);
                            if (op.icon ) {
                                $(">div>div:last", node).toggleClass(op.options.folderExp).toggleClass(op.options.folderColl);
                            }
                        }
                        ( tree.is(":hidden") ) ? tree.slideDown(100): ( isA ? "": tree.slideUp(100) );
                        return false;
                    });
                    addSpace(op.level, node);
                    if (op.showSub ) {
                        tree.subTree(op, op.level + 1);
                    }
                } else {
                    node.children().wrap("<div></div>");
                    $(">div", node).prepend(( op.ckbox ? "<div class='ckbox " + checked + "'></div>": "" )
                            + ( op.icon ? "<div class='"+op.options.file+"'></div>": "<div class='node'></div>" ));
                    if(op.icon ) {
                        $(">div>div."+op.options.file, node).click(function() {
                            $(this).next().click();
                            return false;
                        });
                    }
                    addSpace(op.level, node);
                }
                if (op.ckbox ) {
                    node._check(op);
                }
                if (!$.support.leadingWhitespace ) {
                    $(">div", node).click(function() {
                        $("a", this).trigger("click");
                        return false;
                    });
                }
            });
            function addSpace(level, node) {
                if (level > 0 ) {
                    var parent = node.parent().parent();
                    var space = !parent.next()[0] ? "indent": "line";
                    var plist = "<div class='" + space + "'></div>";
                    if (level > 1 ) {
                        var next = $(">div>div", parent).filter(":first");
                        var prev = "";
                        while (level > 1) {
                            prev = prev + "<div class='" + next.attr("class") + "'></div>";
                            next = next.next();
                            level--;
                        }
                        plist = prev + plist;
                    }
                    $(">div", node).prepend(plist);
                }
            }
        }, _check: function(op) {
            var node = $(this);
            var ckbox = $(">div>.ckbox", node);
            var $input = node.find("a");
            var tname = $input.attr("tname"), tvalue = $input.attr("tvalue");
            var attrs = "";
            if (tname ) {
                attrs += "name='" + tname + "' ";
            }
            if (tvalue ) {
                attrs += "value='" + tvalue + "' ";
            }
            ckbox.append("<input type='checkbox' style='display:none;' " + attrs + "/>").click(function() {
                var cked = ckbox.hasClass("checked");
                var aClass = cked ? "unchecked": "checked";
                var rClass = cked ? "checked": "unchecked";
                ckbox.removeClass(rClass).removeClass(!cked ? "indeterminate": "").addClass(aClass);
                $("input", ckbox).prop("checked", !cked);
                $(">ul", node).find("li").each(function() {
                    var box = $("div.ckbox", this);
                    box.removeClass(rClass).removeClass(!cked ? "indeterminate": "").addClass(aClass).find("input").prop("checked", !cked);
                });
                $(node)._checkParent(op.excludeParent);
                return false;
            });
            var cAttr = $input.attr("checked") || false;
            if (cAttr ) {
                ckbox.find("input").prop("checked", true);
                ckbox.removeClass("unchecked").addClass("checked");
                $(node)._checkParent(op.excludeParent);
            }
        }, _checkParent: function(excludeParent) {
            if ($(this).parent().hasClass("tree") ) {
                return;
            }
            var parent = $(this).parent().parent();
            var stree = $(">ul", parent);
            var ckbox = stree.find(">li>a").size() + stree.find("div.ckbox").size();
            var ckboxed = stree.find("div.checked").size();
            var aClass = ( ckboxed == ckbox ? "checked": ( ckboxed != 0 ? "indeterminate": "unchecked" ) );
            var rClass = ( ckboxed == ckbox ? "indeterminate": ( ckboxed != 0 ? "checked": "indeterminate" ) );
            $(">div>.ckbox", parent).removeClass("unchecked").removeClass("checked").removeClass(rClass).addClass(aClass);
            var $checkbox = $(":checkbox", parent);
            if (aClass == "checked" ) {
                $checkbox.prop("checked", true);
                $(">div>.ckbox", parent).find("input").prop("checked", true);
            } else if (aClass == "unchecked" ) {
                $checkbox.removeAttr("checked");
            } else if (aClass == "indeterminate" && !excludeParent) {
                $(">div>.ckbox", parent).find("input").prop("checked", true);
            }
            parent._checkParent(excludeParent);
        }
    });
} )(jQuery);
/**
 * @author Roger Wu
 */

( function($) {
    var jmenus = new Map();
    // If the DWZ scope is not available, add it
    $.dwz = $.dwz || {};
    $.fn.extend({
        accordion: function(options, data) {
            var args = Array.prototype.slice.call(arguments, 1);
            return this.each(function() {
                if (options.fillSpace) jmenus.put(options.fillSpace, this);
                if (typeof options == "string" ) {
                    var accordion = $.data(this, "dwz-accordion");
                    accordion[options].apply(accordion, args);
                    // INIT with optional options
                } else if (!$(this).is(".dwz-accordion") ) {
                    $.data(this, "dwz-accordion", new $.dwz.accordion(this, options));
                }
            });
        },
        /**
         * deprecated, use accordion("activate", index) instead
         *
         * @param {Object}
         *            index
         */
        activate: function(index) {
            return this.accordion("activate", index);
        }
    });
    $.dwz.accordion = function(container, options) {

        // setup configuration
        this.options = options = $.extend({}, $.dwz.accordion.defaults, options);
        this.element = container;
        $(container).addClass("dwz-accordion");
        if (options.navigation ) {
            var current = $(container).find("a").filter(options.navigationFilter);
            if (current.length ) {
                if (current.filter(options.header).length ) {
                    options.active = current;
                } else {
                    options.active = current.parent().parent().prev();
                    current.addClass("current");
                }
            }
        }
        // calculate active if not specified, using the first header
        options.headers = $(container).find(options.header);
        options.active = findActive(options.headers, options.active);
        if ( options.fillSpace ) {
            fillSpace(options.fillSpace);
        } else if ( options.autoheight ) {
            var maxHeight = 0;
            options.headers.next().each(function() {
                maxHeight = Math.max(maxHeight, $(this).outerHeight());
            }).height(maxHeight);
        }
        options.headers.not(options.active || "").next().hide();
        options.active.find("h2").addClass(options.selectedClass);
        options.active.find("h2 .icon").addClass(options.selectedIconClass);
        if (options.event ) {
            $(container).bind( ( options.event ) + ".dwz-accordion", clickHandler);
        }
    };
    $.dwz.accordion.prototype = {
        activate: function(index) {
            // call clickHandler with custom event
            clickHandler.call(this.element, {
                target: findActive(this.options.headers, index)[0]
            });
        },

        enable: function() {
            this.options.disabled = false;
        }, disable: function() {
            this.options.disabled = true;
        }, destroy: function() {
            this.options.headers.next().css("display", "");
            if ( this.options.fillSpace || this.options.autoheight ) {
                this.options.headers.next().css("height", "");
            }
            $.removeData(this.element, "dwz-accordion");
            $(this.element).removeClass("dwz-accordion").unbind(".dwz-accordion");
        }
    }
    function scopeCallback(callback, scope) {
        return function() {
            return callback.apply(scope, arguments);
        };
    }
    function completed(cancel) {
        // if removed while animated data can be empty
        if (!$.data(this, "dwz-accordion") ) {
            return;
        }
        var instance = $.data(this, "dwz-accordion");
        var options = instance.options;
        options.running = cancel ? 0: --options.running;
        if (options.running ) {
            return;
        }
        if (options.clearStyle ) {
            options.toShow.add(options.toHide).css({
                height: "", overflow: ""
            });
        }
        $(this).triggerHandler("change.dwz-accordion", [ options.data ], options.change);
    }
    function fillSpace(key){
        var obj = jmenus.get(key);
        if (!obj) return;

        var parent = $(obj).parent();
        var height = parent.height() - (($(".accordionHeader", obj).size()) * ($(".accordionHeader:first-child", obj).outerHeight())) -2;

        var os = parent.children().not(obj);
        $.each(os, function(i){
            height -= $(os[i]).outerHeight();
        });
        $(".accordionContent",obj).height(height);
    }
    function toggle(toShow, toHide, data, clickedActive, down) {
        var options = $.data(this, "dwz-accordion").options;
        options.toShow = toShow;
        options.toHide = toHide;
        options.data = data;
        var complete = scopeCallback(completed, this);

        // count elements to animate
        options.running = toHide.size() == 0 ? toShow.size(): toHide.size();
        if (options.animated ) {
            if (!options.alwaysOpen && clickedActive ) {
                $.dwz.accordion.animations[options.animated]({
                    toShow: jQuery([ ]), toHide: toHide, complete: complete, down: down, autoheight: options.autoheight
                });
            } else {
                $.dwz.accordion.animations[options.animated]({
                    toShow: toShow, toHide: toHide, complete: complete, down: down, autoheight: options.autoheight
                });
            }
        } else {
            if (!options.alwaysOpen && clickedActive ) {
                toShow.toggle();
            } else {
                toHide.hide();
                toShow.show();
            }
            complete(true);
        }
    }
    function clickHandler(event) {
        var options = $.data(this, "dwz-accordion").options;
        if (options.disabled ) {
            return false;
        }

        // called only when using activate(false) to close all parts
        // programmatically
        if (!event.target && !options.alwaysOpen ) {
            options.active.find("h2").toggleClass(options.selectedClass);
            options.active.find("h2 .icon").toggleClass(options.selectedIconClass);
            var toHide = options.active.next(), data = {
                instance: this, options: options, newHeader: jQuery([ ]), oldHeader: options.active, newContent: jQuery([ ]), oldContent: toHide
            }, toShow = options.active = $([ ]);
            toggle.call(this, toShow, toHide, data);
            return false;
        }
        // get the click target
        var clicked = $(event.target);

        // due to the event delegation model, we have to check if one
        // of the parent elements is our actual header, and find that
        if (clicked.parents(options.header).length ) {
            while (!clicked.is(options.header)) {
                clicked = clicked.parent();
            }
        }
        var clickedActive = clicked[0] == options.active[0];

        // if animations are still active, or the active header is the target,
        // ignore click
        if (options.running || ( options.alwaysOpen && clickedActive ) ) {
            return false;
        }
        if (!clicked.is(options.header) ) {
            return;
        }

        // switch classes
        options.active.find("h2").toggleClass(options.selectedClass);
        options.active.find("h2 .icon").toggleClass(options.selectedIconClass);
        if (!clickedActive ) {
            clicked.find("h2").addClass(options.selectedClass);
            clicked.find("h2 .icon").toggleClass(options.selectedIconClass);
        }

        // find elements to show and hide
        var toShow = clicked.next(), toHide = options.active.next(),
        // data = [clicked, options.active, toShow, toHide],
        data = {
            instance: this, options: options, newHeader: clicked, oldHeader: options.active, newContent: toShow, oldContent: toHide
        }, down = options.headers.index(options.active[0]) > options.headers.index(clicked[0]);
        options.active = clickedActive ? $([ ]): clicked;
        toggle.call(this, toShow, toHide, data, clickedActive, down);
        return false;
    }

    function findActive(headers, selector) {
        return selector != undefined ? typeof selector == "number" ? headers.filter(":eq(" + selector + ")"): headers.not(headers.not(selector)): selector === false ? $([ ])
                : headers.filter(":eq(0)");
    }
    $.extend($.dwz.accordion, {
        defaults: {
            selectedClass: "collapsable",selectedIconClass: "icon-chevron-down", alwaysOpen: true, animated: 'slide', event: "click", header: ".accordionHeader", autoheight: true, running: 0, clearStyle: true,
            navigationFilter: function() {
                return this.href.toLowerCase() == location.href.toLowerCase();
            }
        }, animations: {
            slide: function(options, additions) {
                options = $.extend({
                    easing: "swing", duration: 100
                }, options, additions);
                if (!options.toHide.size() ) {
                    options.toShow.animate({
                        height: "show"
                    }, options);
                    return;
                }
                var hideHeight = options.toHide.height(), showHeight = options.toShow.height(), difference = showHeight / hideHeight;
                options.toShow.css({
                    height: 0
                }).show();
                options.toHide.filter(":hidden").each(options.complete).end().filter(":visible").animate({
                    height: "hide"
                }, {
                    step: function(now) {
                        var current = ( hideHeight - now ) * difference;
                        if (!$.support.leadingWhitespace ) {
                            current = Math.ceil(current);
                        }
                        options.toShow.height(current);
                    }, duration: options.duration, easing: options.easing, complete: function() {
                        options.toShow.css({
                            height: showHeight
                        });
                        options.toShow.css({
                            overflow: "auto"
                        });
                        options.complete();
                    }
                });
            }, bounceslide: function(options) {
                this.slide(options, {
                    easing: options.down ? "bounceout": "swing", duration: options.down ? 200: 100
                });
            }, easeslide: function(options) {
                this.slide(options, {
                    easing: "easeinout", duration: 100
                })
            }
        }
    });
} )(jQuery);

function initEnv() {
    $("body").append(DWZ.frag["dwzFrag"]);
    if (!$.support.leadingWhitespace && /6.0/.test(navigator.userAgent) ) {
        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch (e) {}
    }
    if (!$.support.leadingWhitespace ) {
        window.setInterval("CollectGarbage();", 10000);
    }
    $(window).resize(function() {
        initLayout();
        $(this).trigger(DWZ.eventType.resizeGrid);
    });
    var ajaxbg = $("#background,#progressBar");
    ajaxbg.hide();
    ajaxbg.click(function(){
        $('#background,#progressBar').hide();
    });
    $(document).ajaxStart(function() {
        ajaxbg.show();
    }).ajaxStop(function() {
        ajaxbg.hide();
    });
    $("#leftside").jBar({
        minW: 150, maxW: 700
    });
    if ($.taskBar ){
        $.taskBar.init();
    }
    setTimeout(function() {
        initLayout();
        if (window.navTab) {
            navTab.init();
        }
        initUI();
        if ($.fn.navMenu ){
            var hash = location.hash.skipChar('#').replace(/\?.*$/, '');
            var callback;
            var parentId;
            if(hash ) {
                parentId = hash.substring(0, hash.indexOf('_'));
                var tabid = hash.substring(hash.indexOf('_') + 1);
                if(tabid ) {
                    callback = function(){
                        $('#menu a[rel='+escapeJquery(tabid)+']').click();
                    }
                }
            }
            $("#navMenu").navMenu(callback);
            if(parentId ) {
                $('#navMenu a[parentid='+parentId+']').click();
            }
        }
        $(document).trigger(DWZ.eventType.initEnvAfter);
    }, 10);
}
function initLayout() {
    var iContentW = $(window).width() - (DWZ.ui.sbar ? $("#sidebar").width() : $("#sidebar_s").width());
    var iContentH = $(window).height() - $('header').outerHeight(true) - $('footer').outerHeight(true);
    $("#navTab").css({"width":iContentW});
    $("main .tabsPageContent").height(iContentH - $('.tabsPageHeader').outerHeight(true)).find("[layoutH]").layoutH();
    $("#splitBar, #splitBarProxy").height(iContentH - 2);
    $("#taskbar").css({
        top: iContentH + $("header").height(), width: $(window).width()
    });
  $("#menu").css({'max-height':iContentH-$("#sidebar .collapse").height()});
}

function initUI(_box) {
    var $p = $(_box || document);
    // css tables
    $('table.list', $p).cssTable();
    // jTables
    $('table.table', $p).jTable();

    // auto bind tabs
    $("div.tabs", $p).each(function() {
        var $this = $(this);
        var options = {};
        options.currentIndex = $this.attr("currentIndex") || 0;
        options.eventType = $this.attr("eventType") || "click";
        $this.tabs(options);
    });
    $("ul.tree", $p).jTree();
    $('div.accordion', $p).each(function() {
        var $this = $(this);
        $this.accordion({
            alwaysOpen: false, active: 0, autoheight:false
        });
    });
    $(":button.checkboxCtrl, :checkbox.checkboxCtrl", $p).checkboxCtrl($p);
    if ($.fn.combox ){
        $("select.combox", $p).combox();
    }
    if ($.fn.uploadify ) {
        $(":file[uploaderOption]", $p).each(function() {
            var $this = $(this);
            var options = {
                fileObjName: $this.attr("name") || "file", auto: true, multi: true, onUploadError: uploadifyError
            };
            var uploaderOption = DWZ.jsonEval($this.attr("uploaderOption"));
            $.extend(options, uploaderOption);
            DWZ.debug("uploaderOption: " + DWZ.obj2str(uploaderOption));
            $this.uploadify(options);
        });
    }

    // validate form
    $("form.required-validate", $p).each(function() {
        var $form = $(this);
        $form.validate({
            onsubmit: false, focusInvalid: false, focusCleanup: true, errorElement: "span", ignore: ".ignore", invalidHandler: function(form, validator) {
                var errors = validator.numberOfInvalids();
                if (errors ) {
                    var message = DWZ.msg("validateFormError", [ errors ]);
                    alertMsg.error(message);
                }
            }
        });
        $form.find("input[customvalid]").each(function() {
            var $input = $(this);
            $input.rules("add", {
                customvalid: $input.attr("customvalid")
            })
        });
    });
    if ($.fn.datepicker ) {
        $('input.date', $p).each(function() {
            var $this = $(this);
            var opts = {};
            if ($this.attr("dateFmt") ) {
                opts.pattern = $this.attr("dateFmt");
            }
            if ($this.attr("minDate") ) {
                opts.minDate = $this.attr("minDate");
            }
            if ($this.attr("maxDate") ) {
                opts.maxDate = $this.attr("maxDate");
            }
            if ($this.attr("mmStep") ) {
                opts.mmStep = $this.attr("mmStep");
            }
            if ($this.attr("ssStep") ) {
                opts.ssStep = $this.attr("ssStep");
            }
            $this.datepicker(opts);
        });
    }

    initLink($p);

    $("div.pagination", $p).each(function() {
        var $this = $(this);
        $this.pagination({
            targetType: $this.attr("targetType"), rel: $this.attr("rel"), totalCount: $this.attr("totalCount"), numPerPage: $this.attr("numPerPage") ,
            pageNumShown: $this.attr("pageNumShown"), currentPage: $this.attr("currentPage")
        });
    });
    if ($.fn.sortDrag) {
        $("div.sortDrag", $p).sortDrag();
    }
    if ($.fn.miscSortDrag) {
        $(".miscSortDrag", $p).miscSortDrag();
    }
    
    // dwz.ajax.js
    if ($.fn.multLookup ) {
        $("[multLookup]:button", $p).multLookup();
    }
    if ($.fn.suggest ) {
        $("input[suggestFields]", $p).suggest();
    }
    if ($.fn.itemDetail ) {
        $("table.itemDetail", $p).itemDetail();
    }
    // 执行第三方jQuery插件【 第三方jQuery插件注册：DWZ.regPlugins.push(function($p){}); 】
    $.each(DWZ.regPlugins, function(index, fn) {
        fn($p);
    });
    // init styles
    $("input[type=text], input[type=number], input[type=password], textarea", $p).not("textarea.editor", $p).addClass("textInput");
    $("input[readonly], textarea[readonly]", $p).addClass("readonly");
    $("input[disabled=true], textarea[disabled=true]", $p).addClass("disabled");
    $("input[type=text]", $p).not("div.tabs input[type=text]", $p).filter("[alt]").inputAlert();
}

function initLink($p) {
    // navTab
    $("a[target=navTab]", $p).each(function() {
        $(this).click(function(event) {
            var $this = $(this);
            var title = $this.attr("title") || $this.text();
            if(title){
                title = title.replace(/<[^>]*>/gi,"");
            }
            var titleHtml = $this.attr("title") || $this.html();
            var icon = $this.attr("icon");
            if(icon){
                titleHtml = icon + " " + titleHtml;
            }
            var tabid = $this.attr("rel") || "_blank";
            var fresh = eval($this.attr("fresh") || "true");
            var external = eval($this.attr("external") || "false");
            var url = $this.attr("href").replaceTmById($(event.target).parents(".unitBox:first"));
            var newWindow = (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey);
            DWZ.debug(url);
            if (!url.isFinishedTm() ) {
                alertMsg.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
                return false;
            }
            navTab.openTab(tabid, url, {
                title: title, titleHtml: titleHtml, fresh: fresh, external: external, focusNewWindow:newWindow
            });
            return false;
        });
    });

    // dialogs
    $("a[target=dialog]", $p).each(function() {
        $(this).click(function(event) {
            var $this = $(this);
            var title = $this.attr("title") || $this.html();
            var rel = $this.attr("rel") || "_blank";
            var options = {};
            var w = $this.attr("width");
            var h = $this.attr("height");
            if (w ) {
                options.width = w;
            }
            if (h ) {
                options.height = h;
            }
            options.max = eval($this.attr("max") || "false");
            options.mask = eval($this.attr("mask") || "false");
            options.maxable = eval($this.attr("maxable") || "true");
            options.minable = eval($this.attr("minable") || "true");
            options.fresh = eval($this.attr("fresh") || "true");
            options.resizable = eval($this.attr("resizable") || "true");
            options.drawable = eval($this.attr("drawable") || "true");
            options.close = eval($this.attr("close") || "");
            options.param = $this.attr("param") || "";
            options.focusNewWindow = (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey);
            var url = $this.attr("href").replaceTmById($(event.target).parents(".unitBox:first"));
            DWZ.debug(url);
            if (!url.isFinishedTm() ) {
                alertMsg.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
                return false;
            }
            $.pdialog.open(url, rel, title, options);
            return false;
        });
    });
    $("a[target=ajax]", $p).each(function() {
        $(this).click(function() {
            var $this = $(this);
            var rel = $this.attr("rel");
            if (rel ) {
                var $rel = $("#" + rel);
                $rel.loadUrl($this.attr("href"), {}, function() {
                    $rel.find("[layoutH]").layoutH();
                });
            }
            return false;
        });
    });
    if ($.fn.ajaxTodo ) {
        $("a[target=ajaxTodo]", $p).ajaxTodo();
    }
    if ($.fn.dwzExport ) {
        $("a[target=dwzExport]", $p).dwzExport();
    }
    if ($.fn.lookup ) {
        $("a[lookupGroup]", $p).lookup();
    }
    if ($.fn.selectedTodo ) {
        $("a[target=selectedTodo]", $p).selectedTodo();
    }
}

/**
 * Theme Plugins
 *
 * @author ZhangHuihua@msn.com
 */
( function($) {
    $.fn.extend({
        theme: function(options) {
            var op = $.extend({
                themeBase: "themes", defaultTheme: "default"
            }, options);
            var _themeHref = op.themeBase + "/#theme#/style.css";
            var $themeItem = $("<link href=\"" + _themeHref.replace("#theme#", op.defaultTheme) + "\" rel=\"stylesheet\" media=\"screen\"/>");
            var setTheme = function(themeName) {
                $themeItem.attr("href", _themeHref.replace("#theme#", themeName));
                jThemeLi.find(">div").removeClass("selected");
                jThemeLi.filter("[theme=" + themeName + "]").find(">div").addClass("selected");
                if ($.isFunction($.cookie) ) {
                    $.cookie("dwz_theme", themeName);
                }
            }
            var jThemeLi = $(this).find(">li[theme]");
            jThemeLi.each(function(index) {
                var $this = $(this);
                var themeName = $this.attr("theme");
                if(themeName == op.defaultTheme){
                    $this.find(">div").addClass("selected");
                }
                $this.addClass(themeName).click(function() {
                    setTheme(themeName);
                });
            });
            if ($.isFunction($.cookie) ) {
                if ($.cookie("dwz_theme") ) {
                    setTheme($.cookie("dwz_theme"));
                }
            }
            $themeItem.appendTo($("head"));
            return this;
        }
    });
} )(jQuery);
/**
 * @author zhanghuihua@msn.com
 */
( function($) {
    $.fn.navMenu = function(callback) {
        return this.each(function() {
            var $box = $(this);
            var $callback = callback;
            $box.find("li>a").click(function() {
                var $a = $(this);
                if(!$a.is("[href^=javascript:]")){
                    $("#sidebar #menu").ajaxUrl({
                        type: "get", url: $a.attr("href"), callback: function(response) {
                            $box.find("li").removeClass("selected");
                            $a.parent().addClass("selected");
                            if($callback ) {
                                $callback();
                                $callback = null;
                            }
                        }
                    });
                }
                return false;
            });
        });
    }
} )(jQuery);

/**
 * @author ZhangHuihua@msn.com
 */
$.setRegional("alertMsg", {
    title: {
        error: "Error", info: "Information", warn: "Warning", correct: "Successful", confirm: "Confirmation"
    }, butMsg: {
        ok: "OK", yes: "Yes", no: "No", cancel: "Cancel"
    }
});
var alertMsg = {
    _boxId: "#alertMsgBox", _bgId: "#alertBackground", _closeTimer: null, _types: {
        error: "error", info: "info", warn: "warn", correct: "correct", confirm: "confirm"
    }, _getTitle: function(key) {
        return $.regional.alertMsg.title[key];
    }, _keydownOk: function(event) {
        if (event.keyCode == DWZ.keyCode.ENTER || event.keyCode == DWZ.keyCode.BACKSPACE ){
            event.data.target.trigger("click");
            return false;
        }
    }, _keydownEsc: function(event) {
        if (event.keyCode == DWZ.keyCode.ESC ){
            event.data.target.trigger("click");
        }
    } ,
    /**
     * @param {Object}
     *            type
     * @param {Object}
     *            msg
     * @param {Object}
     *            buttons [button1, button2]
     */
    _open: function(type, msg, buttons) {
        $(this._boxId).remove();
        var butsHtml = "";
        if (buttons ) {
            for (var i = 0; i < buttons.length; i++) {
                var sRel = buttons[i].call ? "callback": "";
                butsHtml += DWZ.frag["alertButFrag"].replace("#butMsg#", buttons[i].name).replace("#callback#", sRel);
            }
        }
        var boxHtml = DWZ.frag["alertBoxFrag"].replace("#type#", type).replace("#title#", this._getTitle(type)).replace("#message#", msg).replace("#butFragment#", butsHtml);
        $($.parseHTML(boxHtml, document, true)).appendTo("body").css({
            top: -$(this._boxId).height() + "px"
        }).animate({
            top: "0px"
        }, 500);
        if (this._closeTimer ) {
            clearTimeout(this._closeTimer);
            this._closeTimer = null;
        }
        if (this._types.info == type || this._types.correct == type ) {
            this._closeTimer = setTimeout(function() {
                alertMsg.close()
            }, 3500);
        } else {
            $(this._bgId).show();
        }
        var jButs = $(this._boxId).find("a.button");
        var jCallButs = jButs.filter("[rel=callback]");
        var jDoc = $(document);
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].call ){
                jCallButs.eq(i).click(buttons[i].call);
            }
            if (buttons[i].keyCode == DWZ.keyCode.ENTER ) {
                jDoc.bind("keydown", {
                    target: jButs.eq(i)
                }, this._keydownOk);
            }
            if (buttons[i].keyCode == DWZ.keyCode.ESC ) {
                jDoc.bind("keydown", {
                    target: jButs.eq(i)
                }, this._keydownEsc);
            }
        }
    }, close: function() {
        $(document).unbind("keydown", this._keydownOk).unbind("keydown", this._keydownEsc);
        $(this._boxId).animate({
            top: -$(this._boxId).height()
        }, 100, function() {
            $(this).remove();
        });
        $(this._bgId).hide();
        if(this._callback){
            this._callback();
            this._callback = null;
        }
    }, error: function(msg, options) {
        this._alert(this._types.error, msg, options);
    }, info: function(msg, options) {
        this._alert(this._types.info, msg, options);
    }, warn: function(msg, options) {
        this._alert(this._types.warn, msg, options);
    }, correct: function(msg, options) {
        this._alert(this._types.correct, msg, options);
    }, _alert: function(type, msg, options) {
        var op = {
            okName: $.regional.alertMsg.butMsg.ok, okCall: null
        };
        $.extend(op, options);
        if(options && options.callback && $.isFunction(options.callback)){
            this._callback = options.callback;
        }
        var buttons = [ {
            name: op.okName, call: op.okCall, keyCode: DWZ.keyCode.ENTER
        } ];
        this._open(type, msg, buttons);
    } ,
    /**
     * @param {Object}
     *            msg
     * @param {Object}
     *            options {okName, okCal, cancelName, cancelCall}
     */
    confirm: function(msg, options) {
        var op = {
            okName: $.regional.alertMsg.butMsg.ok, okCall: null, cancelName: $.regional.alertMsg.butMsg.cancel, cancelCall: null
        };
        $.extend(op, options);
        var buttons = [ {
            name: op.okName, call: op.okCall, keyCode: DWZ.keyCode.ENTER
        }, {
            name: op.cancelName, call: op.cancelCall, keyCode: DWZ.keyCode.ESC
        } ];
        this._open(this._types.confirm, msg, buttons);
    }
};

/**
 * @author zhanghuihua@msn.com
 */

( function($) {
    var menu,  hash;
    $.fn.extend({
        contextMenu: function(id, options) {
            var op = $.extend({
                bindings: {}, ctrSub: null
            }, options);
            if (!menu ) {
                menu = $('<div id="contextmenu"></div>').appendTo('body').hide();
            }
            hash = hash || [ ];
            hash.push({
                id: id, bindings: op.bindings || {}, ctrSub: op.ctrSub
            });
            var index = hash.length - 1;
            $(this).bind('contextmenu', function(e) {
                display(index, this, e, op);
                return false;
            });
            return this;
        }
    });
    function display(index, trigger, e, options) {
        var cur = hash[index];
        var content = $(DWZ.frag[cur.id]);
        content.find('li');

        // Send the content to the menu
        menu.html(content);
        $.each(cur.bindings, function(id, func) {
            $("[rel='" + id + "']", menu).bind('click', function(e) {
                hide();
                func($(trigger), $("#" + cur.id));
            });
        });
        var posX = e.pageX;
        var posY = e.pageY;
        if ($(window).width() < posX + menu.width() ) {
            posX -= menu.width();
        }
        if ($(window).height() < posY + menu.height() ) {
            posY -= menu.height();
        }
        menu.css({
            'left': posX, 'top': posY
        }).show();
        $(document).one('click', hide);
        if ($.isFunction(cur.ctrSub) ) {
            cur.ctrSub($(trigger), $("#" + cur.id));
        }
    }
    function hide() {
        menu.hide();
    }
} )(jQuery);

/**
 * @author ZhangHuihua@msn.com
 */
var navTab = {
    componentBox: null, // tab component. contain tabBox, prevBut, nextBut,
    // panelBox
    _tabBox: null ,
    _prevBut: null ,
    _nextBut: null ,
    _panelBox: null ,
    _moreBut: null ,
    _moreBox: null ,
    _currentIndex: 0 ,
    _op: {
        id: "navTab", step: 4 , stTabBox: ".navTab-tab", stPanelBox: ".navTab-panel", mainTabId: "main", close$: "a.close", prevClass: "tabsLeft", nextClass: "tabsRight" ,
        stMore: ".tabsMore", stMoreLi: "ul.tabsMoreList"
    } ,
    init: function(options) {
        if ($.History) {
            $.History.init();
        }
        var $this = this;
        $.extend(this._op, options);
        this.componentBox = $("#" + this._op.id);
        this.step = this._op.step;
        this._tabBox = this.componentBox.find(this._op.stTabBox);
        this._panelBox = this.componentBox.find(this._op.stPanelBox);
        this._prevBut = this.componentBox.find("." + this._op.prevClass);
        this._nextBut = this.componentBox.find("." + this._op.nextClass);
        this._moreBut = this.componentBox.find(this._op.stMore);
        this._moreBox = this.componentBox.find(this._op.stMoreLi);
        this._prevBut.click(function(event) {
            $this._scrollPrev()
        });
        this._nextBut.click(function(event) {
            $this._scrollNext()
        });
        this._moreBut.click(function() {
            $this._moreBox.show();
            return false;
        });
        $(document).click(function() {
            $this._moreBox.hide()
        });
        this._contextmenu(this._tabBox);
        this._contextmenu(this._getTabs());
        this._init();
        this._ctrlScrollBut();
    } ,
    _init: function() {
        var $this = this;
        this._getTabs().each(function(iTabIndex) {
            $(this).unbind("click").click(function(event) {
                $this._switchTab(iTabIndex);
            });
            $(this).find(navTab._op.close$).unbind("click").click(function() {
                $this._closeTab(iTabIndex);
            });
        });
        this._getMoreLi().each(function(iTabIndex) {
            $(this).find(">a").unbind("click").click(function(event) {
                $this._switchTab(iTabIndex);
            });
        });
        this._switchTab(this._currentIndex);
    } ,
    _contextmenu: function($obj) { // navTab右键菜单
        var $this = this;
        $obj.contextMenu('navTabCM', {
            bindings: {
                reload: function(t, m) {
                    $this._reload(t, true);
                }, closeCurrent: function(t, m) {
                    var tabId = t.attr("tabid");
                    if (tabId ) {
                        $this.closeTab(tabId);
                    } else {
                        $this.closeCurrentTab();
                    }
                }, closeOther: function(t, m) {
                    var index = $this._indexTabId(t.attr("tabid"));
                    $this._closeOtherTab(index > 0 ? index: $this._currentIndex);
                }, closeAll: function(t, m) {
                    $this.closeAllTab();
                }
            }, ctrSub: function(t, m) {
                var mReload = m.find("[rel='reload']");
                var mCur = m.find("[rel='closeCurrent']");
                var mOther = m.find("[rel='closeOther']");
                var mAll = m.find("[rel='closeAll']");
                var $tabLi = $this._getTabs();
                if ($tabLi.size() < 2 ) {
                    mCur.addClass("disabled");
                    mOther.addClass("disabled");
                    mAll.addClass("disabled");
                }
                if ($this._currentIndex == 0 || t.attr("tabid") == $this._op.mainTabId ) {
                    mCur.addClass("disabled");
                    if(!t.attr('url')){
                        mReload.addClass("disabled");
                    }
                } else if ($tabLi.size() == 2 ) {
                    mOther.addClass("disabled");
                }
            }
        });
    } ,
    _getTabs: function() {
        return this._tabBox.find("> li");
    } ,
    _getPanels: function() {
        return this._panelBox.find("> div");
    } ,
    _getMoreLi: function() {
        return this._moreBox.find("> li");
    } ,
    _getTab: function(tabid) {
        var index = this._indexTabId(tabid);
        if (index >= 0 ) {
            return this._getTabs().eq(index);
        }
    } ,
    getPanel: function(tabid) {
        var index = this._indexTabId(tabid);
        if (index >= 0 ) {
            return this._getPanels().eq(index);
        }
    } ,
    _getTabsW: function(iStart, iEnd) {
        return this._tabsW(this._getTabs().slice(iStart, iEnd));
    } ,
    _tabsW: function($tabs) {
        var iW = 0;
        $tabs.each(function() {
            iW += $(this).outerWidth(true);
        });
        return iW;
    } ,
    _indexTabId: function(tabid) {
        if (!tabid ) {
            return -1;
        }
        var iOpenIndex = -1;
        this._getTabs().each(function(index) {
            if ($(this).attr("tabid") == tabid ) {
                iOpenIndex = index;
                return;
            }
        });
        return iOpenIndex;
    } ,
    _getLeft: function() {
        return this._tabBox.position().left;
    } ,
    _getScrollBarW: function() {
        return this.componentBox.width() - 90;
    } ,
    _visibleStart: function() {
        var iLeft = this._getLeft(), iW = 0;
        var $tabs = this._getTabs();
        for (var i = 0; i < $tabs.size(); i++) {
            if (iW + iLeft >= 0 ) {
                return i;
            }
            iW += $tabs.eq(i).outerWidth(true);
        }
        return 0;
    } ,
    _visibleEnd: function() {
        var iLeft = this._getLeft(), iW = 0;
        var $tabs = this._getTabs();
        for (var i = 0; i < $tabs.size(); i++) {
            iW += $tabs.eq(i).outerWidth(true);
            if (iW + iLeft > this._getScrollBarW() ) {
                return i;
            }
        }
        return $tabs.size();
    } ,
    _scrollPrev: function() {
        var iStart = this._visibleStart();
        if (iStart >= this.step ) {
            this._scrollTab(-this._getTabsW(0, iStart - this.step));
        } else if (iStart > 0 ) {
            this._scrollTab(-this._getTabsW(0, iStart - 1));
        }
    } ,
    _scrollNext: function() {
        var iEnd = this._visibleEnd();
        if (iEnd + this.step <= this._getTabs().size() ) {
            this._scrollTab(-this._getTabsW(0, iEnd + this.step) + this._getScrollBarW());
        } else if (iEnd < this._getTabs().size() ) {
            this._scrollTab(-this._getTabsW(0, iEnd + 1) + this._getScrollBarW());
        }
    } ,
    _scrollTab: function(iLeft, isNext) {
        var $this = this;
        this._tabBox.animate({
            left: iLeft + 'px'
        }, 200, function() {
            $this._ctrlScrollBut();
        });
    } ,
    _scrollCurrent: function() { // auto scroll current tab
        var iW = this._tabsW(this._getTabs());
        if (iW <= this._getScrollBarW() ) {
            this._scrollTab(0);
        } else if (this._getLeft() < this._getScrollBarW() - iW ) {
            this._scrollTab(this._getScrollBarW() - iW);
        } else if (this._currentIndex < this._visibleStart() ) {
            this._scrollTab(-this._getTabsW(0, this._currentIndex));
        } else if (this._currentIndex >= this._visibleEnd() ) {
            this._scrollTab(this._getScrollBarW() - this._getTabs().eq(this._currentIndex).outerWidth(true) - this._getTabsW(0, this._currentIndex));
        }
    } ,
    _ctrlScrollBut: function() {
        var iW = this._tabsW(this._getTabs());
        if (this._getScrollBarW() > iW ) {
            this._prevBut.addClass("tabsLeftDisabled");
            this._nextBut.addClass("tabsRightDisabled");
            this._tabBox.parent().removeClass("tabsPageHeaderMargin");
        } else {
            this._prevBut.removeClass("tabsLeftDisabled");
            this._nextBut.removeClass("tabsRightDisabled");
            this._tabBox.parent().addClass("tabsPageHeaderMargin");
            if (this._getLeft() >= 0 ) {
                this._prevBut.addClass("tabsLeftDisabled");
            } else if (this._getLeft() <= this._getScrollBarW() - iW ) {
                this._nextBut.addClass("tabsRightDisabled");
            }
        }
    } ,
    _switchTab: function(iTabIndex) {
        var $tab = this._getTabs().removeClass("selected").eq(iTabIndex).addClass("selected");
        this._getPanels().css("visibility","hidden").height(0).eq(iTabIndex).css("visibility","visible").css('height','auto');
        this._getMoreLi().removeClass("selected").eq(iTabIndex).addClass("selected");
        this._currentIndex = iTabIndex;
        this._scrollCurrent();
        this._reload($tab);
    } ,
    _closeTab: function(index, openTabid) {
        this._getTabs().eq(index).remove();
        this._getPanels().eq(index).trigger(DWZ.eventType.pageClear).remove();
        this._getMoreLi().eq(index).remove();
        if (this._currentIndex >= index ) {
            this._currentIndex--;
        }
        if (openTabid ) {
            var openIndex = this._indexTabId(openTabid);
            if (openIndex > 0 ) {
                this._currentIndex = openIndex;
            }
        }
        this._init();
        this._scrollCurrent();
        this._reload(this._getTabs().eq(this._currentIndex));
    } ,
    closeTab: function(tabid) {
        var index = this._indexTabId(tabid);
        if (index > 0 ) {
            this._closeTab(index);
        }
    } ,
    closeCurrentTab: function(openTabid) { // openTabid
        // 可以为空，默认关闭当前tab后，打开最后一个tab
        if (this._currentIndex > 0 ) {
            this._closeTab(this._currentIndex, openTabid);
        }
    } ,
    closeAllTab: function() {
        this._getTabs().filter(":gt(0)").remove();
        this._getPanels().filter(":gt(0)").trigger(DWZ.eventType.pageClear).remove();
        this._getMoreLi().filter(":gt(0)").remove();
        this._currentIndex = 0;
        this._init();
        this._scrollCurrent();
    } ,
    _closeOtherTab: function(index) {
        index = index || this._currentIndex;
        if (index > 0 ) {
            var str$ = ":eq(" + index + ")";
            this._getTabs().not(str$).filter(":gt(0)").remove();
            this._getPanels().not(str$).filter(":gt(0)").trigger(DWZ.eventType.pageClear).remove();
            this._getMoreLi().not(str$).filter(":gt(0)").remove();
            this._currentIndex = 1;
            this._init();
            this._scrollCurrent();
        } else {
            this.closeAllTab();
        }
    } ,
    _loadUrlCallback: function($panel) {
        $panel.find("[layoutH]").layoutH();
        $panel.find(":button.close").click(function() {
            navTab.closeCurrentTab();
        });
    } ,
    _reload: function($tab, flag) {
        flag = flag || $tab.data("reloadFlag");
        var url = $tab.attr("url");
        if (flag && url ) {
            $tab.data("reloadFlag", null);
            var $panel = this.getPanel($tab.attr("tabid"));
            if ($tab.hasClass("external") || url.isExternalUrl()) {
                navTab.openExternal(url, $panel);
            } else {
                // 获取pagerForm参数
                var $pagerForm = $(".pagerForm", $panel);
                if(0==$pagerForm.length || "2" ==flag){
                    $panel.loadUrl(url, $pagerForm.serializeArray(), function() {
                        navTab._loadUrlCallback($panel);
                    });
                }else{
                    $pagerForm.submit();
                }
            }
        }
    } ,
    reloadFlag: function(tabid,value) {
        var $tab = this._getTab(tabid);
        if ($tab ) {
            if (this._indexTabId(tabid) == this._currentIndex ) {
                this._reload($tab, true);
            } else {
                if(!value){
                    value = 1;
                }
                $tab.data("reloadFlag", value);
            }
        }
    } ,
    reload: function(url, options) {
        var op = $.extend({
            data: {}, navTabId: "", callback: null
        }, options);
        var $tab = op.navTabId ? this._getTab(op.navTabId): this._getTabs().eq(this._currentIndex);
        var $panel = op.navTabId ? this.getPanel(op.navTabId): this._getPanels().eq(this._currentIndex);
        if ($panel ) {
            if (!url ) {
                url = $tab.attr("url");
            }
            if (url ) {
                if ($tab.hasClass("external") ) {
                    navTab.openExternal(url, $panel);
                } else {
                    if ($.isEmptyObject(op.data) ) { // 获取pagerForm参数
                        var $pagerForm = $(".pagerForm", $panel);
                        op.data = $pagerForm.size() > 0 ? $pagerForm.serializeArray(): {}
                    }
                    $panel.ajaxUrl({
                        type: "POST", url: url, data: op.data, callback: function(response) {
                            navTab._loadUrlCallback($panel);
                            if ($.isFunction(op.callback) ) {
                                op.callback(response);
                            }
                        }
                    });
                }
            }
        }
    } ,
    getCurrentPanel: function() {
        return this._getPanels().eq(this._currentIndex);
    } ,
    checkTimeout: function() {
        var json = DWZ.jsonEval(this.getCurrentPanel().html());
        if (json && json.statusCode == DWZ.statusCode.timeout ) {
            this.closeCurrentTab();
        }
    } ,
    openExternal: function(url, $panel) {
        var ih = navTab._panelBox.height();
        $panel.html(DWZ.frag["externalFrag"].replaceAll("{url}", url).replaceAll("{height}", ih + "px"));
    } ,
    /**
     * @param {Object}
     *            tabid
     * @param {Object}
     *            url
     * @param {Object}
     *            params: title, data, fresh
     */
    openTab: function(tabid, url, options) { // if found tabid replace tab,
        // else create a new tab.
        var op = $.extend({
            title: "New Tab", titleHtml: "New Tab", data: {}, fresh: true, external: false, focusNewWindow:false
        }, options);
        var iOpenIndex = this._indexTabId(tabid);
        if (iOpenIndex >= 0 && !op.focusNewWindow) {
            var $tab = this._getTabs().eq(iOpenIndex);
            var $panel = this._getPanels().eq(iOpenIndex);
            if (op.fresh || $tab.attr("url") != url ) {
                $tab.attr("url", url);
                if (op.external || url.isExternalUrl() ) {
                    $tab.addClass("external");
                    navTab.openExternal(url, $panel);
                } else {
                    $tab.removeClass("external");
                    $panel.ajaxUrl({
                        type: "GET", url: url, data: op.data, callback: function() {
                            navTab._loadUrlCallback($panel);
                        }
                    });
                }
            }
            this._currentIndex = iOpenIndex;
        } else {
            if(op.focusNewWindow){
              tabid += Math.round(Math.random() * 10000000);
            }
            this._getPanels().eq(this._currentIndex).after('<div class="page unitBox"></div>');
            this._getTabs().eq(this._currentIndex).after('<li tabid="' + tabid + '"><a href="javascript:" title="' + op.title + '">' + op.titleHtml
                    + '</a><a href="javascript:;" class="close"><i class="icon-remove-sign"></i></a></li>');
            this._getMoreLi().eq(this._currentIndex).after('<li><a href="javascript:" title="' + op.title + '">' + op.titleHtml + '</a></li>');
            var $tabs = this._getTabs();
            var $tab = $tabs.eq(this._currentIndex+1);
            var $panel = this._getPanels().eq(this._currentIndex+1);

            if (op.external || url.isExternalUrl() ) {
                $tab.addClass("external");
                navTab.openExternal(url, $panel);
            } else {
                $tab.removeClass("external");
                $panel.ajaxUrl({
                    type: "GET", url: url, data: op.data, callback: function() {
                        navTab._loadUrlCallback($panel);
                    }
                });
            }
            if ($.History) {
                setTimeout(function(){
                    $.History.addHistory($('#navMenu .selected a').attr('parentid') + '_' + tabid, function(hash){
                        var tabid = hash.substring(hash.indexOf('_')+1);
                        var i = navTab._indexTabId(tabid);
                        if (i >= 0) navTab._switchTab(i);
                    }, tabid);
                }, 10);
            }
            this._currentIndex = this._currentIndex + 1;
            this._contextmenu($tabs.eq(this._currentIndex));
        }
        this._init();
        this._scrollCurrent();
        this._getTabs().eq(this._currentIndex).attr("url", url);
    }
};
/**
 * @author ZhangHuihua@msn.com
 */
( function($) {
    $.fn.extend({

        /**
         * options: reverse[true, false], eventType[click, hover],
         * currentIndex[default index 0] stTab[tabs selector], stTabPanel[tab
         * panel selector] ajaxClass[ajax load], closeClass[close tab]
         */
        tabs: function(options) {
            var op = $.extend({
                reverse: false, eventType: "click", currentIndex: 0, stTabHeader: "> .tabsHeader", stTab: ">.tabsHeaderContent>ul", stTabPanel: "> .tabsContent" ,
                ajaxClass: "j-ajax", closeClass: "close", prevClass: "tabsLeft", nextClass: "tabsRight"
            }, options);
            return this.each(function() {
                initTab($(this));
            });
            function initTab(jT) {
                var jSelector = jT.add($("> *", jT));
                var jTabHeader = $(op.stTabHeader, jSelector);
                var jTabs = $(op.stTab + " li", jTabHeader);
                var jGroups = $(op.stTabPanel + " > *", jSelector);
                jTabs.unbind().find("a").unbind();
                jTabHeader.find("." + op.prevClass).unbind();
                jTabHeader.find("." + op.nextClass).unbind();
                jTabs.each(function(iTabIndex) {
                    if (op.currentIndex == iTabIndex ) {
                        $(this).addClass("selected");
                    } else {
                        $(this).removeClass("selected");
                    }
                    if (op.eventType == "hover" ) {
                        $(this).hover(function(event) {
                            switchTab(jT, iTabIndex)
                        });
                    } else {
                        $(this).click(function(event) {
                            switchTab(jT, iTabIndex)
                        });
                    }
                    $("a", this).each(function() {
                        if ($(this).hasClass(op.ajaxClass) ) {
                            $(this).click(function(event) {
                                var jGroup = jGroups.eq(iTabIndex);
                                if (this.href && !jGroup.attr("loaded") ) {
                                    jGroup.loadUrl(this.href, {}, function() {
                                        jGroup.find("[layoutH]").layoutH();
                                        jGroup.attr("loaded", true);
                                    });
                                }
                                event.preventDefault();
                            });
                        } else if ($(this).hasClass(op.closeClass) ) {
                            $(this).click(function(event) {
                                jTabs.eq(iTabIndex).remove();
                                jGroups.eq(iTabIndex).remove();
                                if (iTabIndex == op.currentIndex ) {
                                    op.currentIndex = ( iTabIndex + 1 < jTabs.size() ) ? iTabIndex: iTabIndex - 1;
                                } else if (iTabIndex < op.currentIndex ) {
                                    op.currentIndex = iTabIndex;
                                }
                                initTab(jT);
                                return false;
                            });
                        }
                    });
                });
                switchTab(jT, op.currentIndex);
            }
            function switchTab(jT, iTabIndex) {
                var jSelector = jT.add($("> *", jT));
                var jTabHeader = $(op.stTabHeader, jSelector);
                var jTabs = $(op.stTab + " li", jTabHeader);
                var jGroups = $(op.stTabPanel + " > *", jSelector);
                var jTab = jTabs.eq(iTabIndex);
                var jGroup = jGroups.eq(iTabIndex);
                if (op.reverse && ( jTab.hasClass("selected") ) ) {
                    jTabs.removeClass("selected");
                    jGroups.hide();
                } else {
                    op.currentIndex = iTabIndex;
                    jTabs.removeClass("selected");
                    jTab.addClass("selected");
                    jGroups.hide().eq(op.currentIndex).show();
                }
                if (!jGroup.attr("inited") ) {
                    jGroup.attr("inited", 1000).find("input[type=text]").filter("[alt]").inputAlert();
                }
            }
        }
    });
} )(jQuery);
/**
 * @author Roger Wu
 * @version 1.0
 */
( function($) {
    $.fn.extend({
        jresize: function(options) {
            if (typeof options == 'string' ) {
                if (options == 'destroy' ) {
                    return this.each(function() {
                        var dialog = this;
                        $("div[class^='resizable']", dialog).each(function() {
                            $(this).hide();
                        });
                    });
                }
            }
            return this.each(function() {
                var dialog = $(this);
                var resizable = $(".resizable");
                $("div[class^='resizable']", dialog).each(function() {
                    var bar = this;
                    $(bar).mousedown(function(event) {
                        $.pdialog.switchDialog(dialog);
                        $.resizeTool.start(resizable, dialog, event, $(bar).attr("tar"));
                        return false;
                    }).show();
                });
            });
        }
    });
    $.resizeTool = {
        start: function(resizable, dialog, e, target) {
            $.pdialog.initResize(resizable, dialog, target);
            $.data(resizable[0], 'layer-drag', {
                options: $.extend($.pdialog._op, {
                    target: target, dialog: dialog, stop: $.resizeTool.stop
                })
            });
            $.layerdrag.start(resizable[0], e, $.pdialog._op);
        }, stop: function() {
            var data = $.data(arguments[0], 'layer-drag');
            $.pdialog.resizeDialog(arguments[0], data.options.dialog, data.options.target);
            $("body").css("cursor", "");
            $(arguments[0]).hide();
        }
    };
    $.layerdrag = {
        start: function(obj, e, options) {
            if (!$.layerdrag.current ) {
                $.layerdrag.current = {
                    el: obj, oleft: parseInt(obj.style.left) || 0, owidth: parseInt(obj.style.width) || 0, otop: parseInt(obj.style.top) || 0 ,
                    oheight: parseInt(obj.style.height) || 0, ox: e.pageX || e.screenX, oy: e.pageY || e.clientY
                };
                $(document).bind('mouseup', $.layerdrag.stop);
                $(document).bind('mousemove', $.layerdrag.drag);
            }
            return $.layerdrag.preventEvent(e);
        }, drag: function(e) {
            if (!e ) {
                var e = window.event;
            }
            var current = $.layerdrag.current;
            var data = $.data(current.el, 'layer-drag');
            var lmove = ( e.pageX || e.screenX ) - current.ox;
            var tmove = ( e.pageY || e.clientY ) - current.oy;
            if ( ( e.pageY || e.clientY ) <= 0 || ( e.pageY || e.clientY ) >= ( $(window).height() - $(".dialogHeader", $(data.options.dialog)).outerHeight() ) ) {
                return false;
            }
            var target = data.options.target;
            var width = current.owidth;
            var height = current.oheight;
            if (target != "n" && target != "s" ) {
                width += ( target.indexOf("w") >= 0 ) ? -lmove: lmove;
            }
            if (width >= $.pdialog._op.minW ) {
                if (target.indexOf("w") >= 0 ) {
                    current.el.style.left = ( current.oleft + lmove ) + 'px';
                }
                if (target != "n" && target != "s" ) {
                    current.el.style.width = width + 'px';
                }
            }
            if (target != "w" && target != "e" ) {
                height += ( target.indexOf("n") >= 0 ) ? -tmove: tmove;
            }
            if (height >= $.pdialog._op.minH ) {
                if (target.indexOf("n") >= 0 ) {
                    current.el.style.top = ( current.otop + tmove ) + 'px';
                }
                if (target != "w" && target != "e" ) {
                    current.el.style.height = height + 'px';
                }
            }
            return $.layerdrag.preventEvent(e);
        }, stop: function(e) {
            var current = $.layerdrag.current;
            var data = $.data(current.el, 'layer-drag');
            $(document).unbind('mousemove', $.layerdrag.drag);
            $(document).unbind('mouseup', $.layerdrag.stop);
            if (data.options.stop ) {
                data.options.stop.apply(current.el, [ current.el ]);
            }
            $.layerdrag.current = null;
            return $.layerdrag.preventEvent(e);
        }, preventEvent: function(e) {
            if (e.stopPropagation ) {
                e.stopPropagation();
            }
            if (e.preventDefault ) {
                e.preventDefault();
            }
            return false;
        }
    };
} )(jQuery);
/**
 * @author Roger Wu reference:dwz.drag.js, dwz.dialogDrag.js, dwz.resize.js,
 *         dwz.taskBar.js
 */
( function($) {
    $.pdialog = {
        _op: {
            height: 500, width: 850, minH: 40, minW: 50, total: 20, max: false, mask: false, resizable: true, drawable: true, maxable: true, minable: true ,focusNewWindow: false,
            fresh: true
        } ,
        _current: null ,
        _zIndex: 42 ,
        getCurrent: function() {
            return this._current;
        } ,
        reload: function(url, options) {
            var op = $.extend({
                data: {}, dialogId: "", callback: null
            }, options);
            var dialog = ( op.dialogId && $("body").data(op.dialogId) ) || this._current;
            if (dialog ) {
                var jDContent = dialog.find(".dialogContent");
                jDContent.ajaxUrl({
                    type: "POST", url: url, data: op.data, callback: function(response) {
                        jDContent.find("[layoutH]").layoutH(jDContent);
                        $(":button.close", dialog).click(function() {
                            $.pdialog.close(dialog);
                            return false;
                        });
                        if ($.isFunction(op.callback) ) {
                            op.callback(response);
                        }
                    }
                });
            }
        } ,
        // 打开一个层
        open: function(url, dlgid, title, options) {
            var op = $.extend({}, $.pdialog._op, options);
            var dialog = $("body").data(dlgid);
            // 重复打开一个层
            if (dialog && !op.focusNewWindow) {
                if (dialog.is(":hidden") ) {
                    dialog.show();
                }
                if (op.fresh || url != dialog.data("url") ) {
                    dialog.data("url", url);
                    dialog.find(".dialogHeader").find("h1").html(title);
                    this.switchDialog(dialog);
                    var jDContent = dialog.find(".dialogContent");
                    jDContent.loadUrl(url, {}, function() {
                        jDContent.find("[layoutH]").layoutH(jDContent);
                        $("button.close").click(function() {
                            $.pdialog.close(dialog);
                            return false;
                        });
                    });
                }
            } else { // 打开一个全新的层
                if(op.focusNewWindow){
                  dlgid += Math.round(Math.random() * 10000000);
                }
                dialog = $($.parseHTML(DWZ.frag["dialogFrag"], document, true)).appendTo($("body"));
                dialog = $(dialog);
                dialog.data("id", dlgid);
                dialog.data("url", url);
                if (options.close ) {
                    dialog.data("close", options.close);
                }
                if (options.param ) {
                    dialog.data("param", options.param);
                }
                ( $.fn.bgiframe && dialog.bgiframe() );
                dialog.find(".dialogHeader").find("h1").html(title);
                dialog.css("zIndex", ( $.pdialog._zIndex += 2 ));
                $.pdialog._init(dialog, options);
                dialog.click(function() {
                    $.pdialog.switchDialog(dialog);
                });
                if (op.resizable ) {
                    dialog.jresize();
                }
                if (op.drawable ) {
                    dialog.dialogDrag();
                }
                $("a.close", dialog).click(function(event) {
                    $.pdialog.close(dialog);
                    return false;
                });
                if (op.maxable ) {
                    $("a.maximize", dialog).show().click(function(event) {
                        $.pdialog.switchDialog(dialog);
                        $.pdialog.maxsize(dialog);
                        dialog.jresize("destroy").dialogDrag("destroy");
                        return false;
                    });
                } else {
                    $("a.maximize", dialog).hide();
                }
                $("a.restore", dialog).click(function(event) {
                    $.pdialog.restore(dialog);
                    dialog.jresize().dialogDrag();
                    return false;
                });
                if (op.minable ) {
                    $("a.minimize", dialog).show().click(function(event) {
                        $.pdialog.minimize(dialog);
                        return false;
                    });
                } else {
                    $("a.minimize", dialog).hide();
                }
                $("div.dialogHeader a", dialog).mousedown(function() {
                    return false;
                });
                $("div.dialogHeader", dialog).dblclick(function() {
                    if ($("a.restore", dialog).is(":hidden") ) {
                        $("a.maximize", dialog).trigger("click");
                    } else {
                        $("a.restore", dialog).trigger("click");
                    }
                });
                if (op.max ) {
                    $.pdialog.maxsize(dialog);
                    dialog.jresize("destroy").dialogDrag("destroy");
                }
                $("body").data(dlgid, dialog);
                $.pdialog._current = dialog;
                // load data
                var jDContent = $(".dialogContent", dialog);
                jDContent.loadUrl(url, {}, function() {
                    jDContent.find("[layoutH]").layoutH(jDContent);
                    $("button.close").click(function() {
                        $.pdialog.close(dialog);
                        return false;
                    });
                });
            }
            if (op.mask ) {
                dialog.css("zIndex", 1000);
                $("a.minimize", dialog).hide();
                dialog.data("mask", true);
                $("#dialogBackground").show();
            } else {
                // add a task to task bar
                if (op.minable ){
                    $.taskBar.addDialog(dlgid, title);
                }
            }
        } ,
        /**
         * 切换当前层
         *
         * @param {Object}
         *            dialog
         */
        switchDialog: function(dialog) {
            var index = dialog.css("zIndex");
            if ($.pdialog._current ) {
                var cindex = $($.pdialog._current).css("zIndex");
                $.pdialog._current.css("zIndex", index);
                dialog.css("zIndex", cindex);
                $.pdialog._current = dialog;
            }
            $.taskBar.switchTask(dialog.data("id"));
        } ,
        _init: function(dialog, options) {
            var op = $.extend({}, this._op, options);
            var height = op.height > op.minH ? op.height < $(document).height() ? op.height: $(document).height() : op.minH;
            var width = op.width > op.minW ? op.width < $(document).width() ? op.width: $(document).width() : op.minW;
            if (isNaN(dialog.height()) || dialog.height() < height ) {
                dialog.height(height);
                $(".dialogContent", dialog).height(height - $(".dialogHeader", dialog).outerHeight());
            }
            if (isNaN(dialog.css("width")) || dialog.width() < width ) {
                dialog.width(width);
            }
            var iTop = ( $(window).height() - dialog.height() ) / 2;
            dialog.css({
                left: ( $(window).width() - dialog.width() ) / 2, top: iTop > 0 ? iTop: 0
            });
        } ,
        /**
         * 初始化半透明层
         *
         * @param {Object}
         *            resizable
         * @param {Object}
         *            dialog
         * @param {Object}
         *            target
         */
        initResize: function(resizable, dialog, target) {
            $("body").css("cursor", target + "-resize");
            resizable.css({
                top: dialog.css("top"), left: dialog.css("left"), height: dialog.css("height"), width: dialog.css("width")
            });
            resizable.show();
        } ,
        /**
         * 改变左右拖动层的高度
         *
         * @param {Object}
         *            target
         * @param {Object}
         *            tmove
         * @param {Object}
         *            dialog
         */
        resizeTool: function(target, tmove, dialog) {
            $("div[class^='resizable']", dialog).filter(function() {
                return $(this).attr("tar") == 'w' || $(this).attr("tar") == 'e';
            }).each(function() {
                $(this).css("height", $(this).outerHeight() + tmove);
            });
        } ,
        /**
         * 改变原始层的大小
         *
         * @param {Object}
         *            obj
         * @param {Object}
         *            dialog
         * @param {Object}
         *            target
         */
        resizeDialog: function(obj, dialog, target) {
            var oleft = parseInt(obj.style.left);
            var otop = parseInt(obj.style.top);
            var height = parseInt(obj.style.height);
            var width = parseInt(obj.style.width);
            if (target == "n" || target == "nw" ) {
                tmove = parseInt(dialog.css("top")) - otop;
            } else {
                tmove = height - parseInt(dialog.css("height"));
            }
            dialog.css({
                left: oleft, width: width, top: otop, height: height
            });
            $(".dialogContent", dialog).css("width", (width -10) + "px");
            if (target != "w" && target != "e" ) {
                var content = $(".dialogContent", dialog);
                content.css({
                    height: height - $(".dialogHeader", dialog).outerHeight()
                });
                content.find("[layoutH]").layoutH(content);
                $.pdialog.resizeTool(target, tmove, dialog);
            }
            $(window).trigger(DWZ.eventType.resizeGrid);
        },
        close: function(dialog) {
            if (typeof dialog == 'string' ) {
                dialog = $("body").data(dialog);
            }
            var close = dialog.data("close");
            var go = true;
            if (close && $.isFunction(close) ) {
                var param = dialog.data("param");
                if (param && param != "" ) {
                    param = DWZ.jsonEval(param);
                    go = close(param);
                } else {
                    go = close();
                }
                if (!go ) {
                    return;
                }
            }
            dialog.hide();
            if (dialog.data("mask") ) {
                $("#dialogBackground").hide();
            } else {
                if (dialog.data("id") ) {
                    $.taskBar.closeDialog(dialog.data("id"));
                }
            }
            $("body").removeData(dialog.data("id"));
            dialog.trigger(DWZ.eventType.pageClear).remove();
            this._current = null;
        },
        closeCurrent: function() {
            this.close($.pdialog._current);
        },
        checkTimeout: function() {
            var $conetnt = $(".dialogContent", $.pdialog._current);
            var json = DWZ.jsonEval($conetnt.html());
            if (json && json[DWZ.keys.statusCode] == DWZ.statusCode.timeout ) {
                this.closeCurrent();
            }
        },
        maxsize: function(dialog) {
            dialog.data("original", {
                top: dialog.css("top"), left: dialog.css("left"), width: dialog.css("width"), height: dialog.css("height")
            });
            $("a.maximize", dialog).hide();
            $("a.restore", dialog).show();
            var iContentW = $(window).width();
            var iContentH = $(window).height() - $('footer').height();
            dialog.css({
                top: "0px", left: "0px", width: iContentW + "px", height: iContentH + "px"
            });
            $.pdialog._resizeContent(dialog,iContentH);
        },
        restore: function(dialog) {
            var original = dialog.data("original");
            var dwidth = parseInt(original.width);
            var dheight = parseInt(original.height);
            dialog.css({
                top: original.top, left: original.left, width: dwidth, height: dheight
            });
            $.pdialog._resizeContent(dialog,dheight);
            $("a.maximize", dialog).show();
            $("a.restore", dialog).hide();
        },
        minimize: function(dialog) {
            dialog.hide();
            var task = $.taskBar.getTask(dialog.data("id"));
            $(".resizable").css({
                top: dialog.css("top"), left: dialog.css("left"), height: dialog.css("height"), width: dialog.css("width")
            }).show().animate({
                top: $(window).height() - 60, left: task.position().left, width: task.outerWidth(), height: task.outerHeight()
            }, 250, function() {
                $(this).hide();
                $.taskBar.inactive(dialog.data("id"));
            });
        },
        _resizeContent: function(dialog,height) {
            var content = $(".dialogContent", dialog);
            content.css({
                height: height - $(".dialogHeader", dialog).outerHeight()
            });
            content.find("[layoutH]").layoutH(content);
            $(window).trigger(DWZ.eventType.resizeGrid);
        }
    };
} )(jQuery);
/**
 * @author Roger Wu
 */
( function($) {
    $.fn.dialogDrag = function(options) {
        if (typeof options == 'string' ) {
            if (options == 'destroy' ) {
                return this.each(function() {
                    var dialog = this;
                    $("div.dialogHeader", dialog).unbind("mousedown");
                });
            }
        }
        return this.each(function() {
            var dialog = $(this);
            $("div.dialogHeader", dialog).mousedown(function(e) {
                $.pdialog.switchDialog(dialog);
                dialog.data("task", true);
                setTimeout(function() {
                    if (dialog.data("task") ) {
                        $.dialogDrag.start(dialog, e);
                    }
                }, 100);
                return false;
            }).mouseup(function(e) {
                dialog.data("task", false);
                return false;
            });
        });
    };
    $.dialogDrag = {
        currId: null, _init: function(dialog) {
            this.currId = new Date().getTime();
            var shadow = $("#dialogProxy");
            if (!shadow.size() ) {
                shadow = $(DWZ.frag["dialogProxy"]);
                $("body").append(shadow);
            }
            $("h1", shadow).html($(".dialogHeader h1", dialog).text());
        },
        start: function(dialog, event) {
            this._init(dialog);
            var sh = $("#dialogProxy");
            sh.css({
                left: dialog.css("left"), top: dialog.css("top"), height: dialog.css("height"), width: dialog.css("width"), zIndex: parseInt(dialog.css("zIndex")) + 1
            }).show();
            $("div.dialogContent", sh).css("height", $("div.dialogContent", dialog).css("height"));
            sh.data("dialog", dialog);
            dialog.css({
                left: "-10000px", top: "-10000px"
            });
            $(sh).jDrag({
                selector: ".dialogHeader", stop: this.stop, event: event
            });
            return false;
        },
        stop: function() {
            var sh = $(arguments[0]);
            var dialog = sh.data("dialog");
            dialog.css({
                left: $(sh).css("left"), top: $(sh).css("top")
            });
            $(sh).hide();
        }
    }
} )(jQuery);
/**
 * @author 张慧华 z@j-ui.com
 */
(function ($) {
    var _op = {
        cursor: 'move', // selector 的鼠标手势
        sortBoxs: 'div.sortDrag', //拖动排序项父容器
        replace: false, //2个sortBox之间拖动替换
        items: '> div, >dl, >p', //拖动排序项选择器
        selector: '', //拖动排序项用于拖动的子元素的选择器，为空时等于item
        zIndex: 1000
    };
    DWZ.sortDrag = {
        _onDrag: false, //用于判断重复绑定拖动事件
        start: function ($sortBox, $item, event, op) {
            var me = this;
            if (me._onDrag) {
                setTimeout(function () {
                    me._onDrag = false;
                }, 500);
                return false;
            }
            me._onDrag = true;

            var $placeholder = this._createPlaceholder($item);
            var $helper = $item.clone();
            var position = $item.position();
            var scrollPosParents = $.scrollPosParents($sortBox);
            $helper.data('$sortBox', $sortBox).data('op', op).data('$item', $item).data('$placeholder', $placeholder);
            $helper.addClass('sortDragHelper').css({
                position: 'absolute', top: position.top + scrollPosParents.top, left: position.left, zIndex: op.zIndex, width: $item.width() + 'px',
                height: $item.height() + 'px'
            }).jDrag({
                selector: op.selector, drag: this.drag, stop: this.stop, event: event
            });
            $item.before($placeholder).before($helper).hide();
            return false;
        } ,
        drag: function (el, event) {
            var $helper = $(arguments[0]), $sortBox = $helper.data('$sortBox'), $placeholder = $helper.data('$placeholder');
            var $items = $sortBox.find($helper.data('op')['items']).filter(':visible').filter(':not(.sortDragPlaceholder, .sortDragHelper)');
            var helperPos = $helper.position(), firstPos = $items.eq(0).position();
            var $overBox = DWZ.sortDrag._getOverSortBox($helper, event);
            if ($sortBox.data('over-sort') == true && $overBox.length > 0 && $overBox[0] != $sortBox[0] && (!$overBox.data("accept") || -1 < $overBox.data("accept").split(",").indexOf($helper.data("type")) )) { //移动到其他容器
                $placeholder.appendTo($overBox);
                $helper.data('$sortBox', $overBox);
            } else {
                for (var i = 0; i < $items.length; i++) {
                    var $this = $items.eq(i), position = $this.position();
                    if (helperPos.top > position.top + 10 || helperPos.left > position.left + 10) {
                        $this.after($placeholder);
                    } else if (helperPos.top <= position.top || helperPos.left <= position.left) {
                        $this.before($placeholder);
                        break;
                    }
                }
            }
        },
        stop: function () {
            var $helper = $(arguments[0]), $sortBox = $helper.data('$sortBox'), $item = $helper.data('$item'), $placeholder = $helper.data('$placeholder');
            var op = $.extend({}, _op, $helper.data('op'));
            var scrollPosParents = $.scrollPosParents($sortBox);
            var position = $placeholder.position();
            $helper.animate({
                    top: (position.top + scrollPosParents.top) + "px",
                    left: position.left + "px"
                }, {
                    complete: function () {
                        if ($helper.data('op')['replace']) { //2个sortBox之间替换处理
                            var $srcBox = $item.parents(op.sortBoxs + ":first");
                            var $destBox = $placeholder.parents(op.sortBoxs + ":first");
                            if ($srcBox[0] != $destBox[0]) { //判断是否移动到其他容器中
                                var $replaceItem = $placeholder.next();
                                if ($replaceItem.length > 0) {
                                    $replaceItem.insertAfter($item);
                                }
                            }
                        }
                        $item.insertAfter($placeholder).show();
                        $placeholder.remove();
                        $helper.remove();
                    },
                    duration: 300
                });

            DWZ.sortDrag._onDrag = false;
        },
        _createPlaceholder: function ($item) {
            return $('<' + $item[0].nodeName + ' class="sortDragPlaceholder"/>').css({
                width: $item.outerWidth() + 'px', height: $item.outerHeight() + 'px', marginTop: $item.css('marginTop'), marginRight: $item.css('marginRight'),
                marginBottom: $item.css('marginBottom'), marginLeft: $item.css('marginLeft')
            });
        },
        _getOverSortBox: function ($item, e) {
            var itemPos = $item.position(),
                y = itemPos.top, x = itemPos.left + ($item.width() / 2);
            var op = $.extend({}, _op, $item.data('op'));
            return $(op.sortBoxs).filter(':visible').filter(function () {
                var $sortBox = $(this), sortBoxPos = $sortBox.position(), sortBoxH = $sortBox.height(), sortBoxW = $sortBox.width();
                return DWZ.isOver(y, x, sortBoxPos.top, sortBoxPos.left, sortBoxH, sortBoxW);
            });
        }
    };

    $.fn.sortDrag = function (options) {
        return this.each(function () {
            var op = $.extend({}, _op, options);
            var $sortBox = $(this);
            if ($sortBox.attr('selector') ) {
                op.selector = $sortBox.attr('selector');
            }
            $sortBox.find(op.items).each(function (i) {
                var $item = $(this), $selector = $item;
                if (op.selector) {
                    $selector = $item.find(op.selector).css({cursor: op.cursor});
                }
                if (op.refresh) {
                    $selector.unbind('mousedown');
                }
                $selector.mousedown(function (event) {
                    if (!$sortBox.hasClass('disabled') && !$(event.target).is('input')&& !$(event.target).is('a')) {
                        DWZ.sortDrag.start($sortBox, $item, event, op);
                        event.preventDefault();
                    }
                });
            });

            $sortBox.find('.close').mousedown(function (event) {
                $(this).parent().remove();
                return false;
            });
        });
    }

})(jQuery);

/**
 * @author 张慧华 z@j-ui.com
 */
(function ($) {
    DWZ.miscDrag = {
        start: function ($sortBox, $item, event, op) {
            var $helper = $item.clone();
            var position = $item.position();
            $helper.addClass('sortDragHelper').css({
                position: 'absolute',
                top: position.top + $sortBox.scrollTop(),
                left: position.left,
                zIndex: op.zIndex,
                minWidth: $item.width() + 'px',
                height: $item.height() + 'px'
            }).jDrag({
                drag: this.drag,
                stop: this.stop,
                event: event
            });
            $helper.data('$sortBox', $sortBox);
            $item.before($helper);
            return false;
        },
        drag: function (el, event) {
        },
        stop: function (el, event) {
            var $helper = $(arguments[0]),
                $sortBox = $helper.data('$sortBox'),
                $overBox = DWZ.miscDrag._getOverSortBox($sortBox.find($sortBox.attr('drag-rel')), $helper);

            if ($overBox.length > 0) { //移动到指定容器

                var $dragBox = $helper.appendTo($overBox).mousedown(function (event) {
                    $(this).jDrag({event: event});
                });

                var txt = $dragBox.html(),
                    icon = $dragBox.data('icon'),
                    id = $dragBox.data('id'),
                    sequence = $overBox.find('> div').length;

                var overBoxPos = $overBox.position(),
                    dragBoxPos = $dragBox.position();

                var content = icon ? '<img src="' + icon + '" />' : txt;
                $dragBox.css({
                    height: 'auto',
                    top: (dragBoxPos.top - overBoxPos.top) + 'px',
                    left: (dragBoxPos.left - overBoxPos.left) + 'px'
                });

                var rel = $sortBox.attr('rel');
                if (rel) {
                    $('<div class="sortDrag" data-id="' + id + '"><h2>' + sequence + '</h2></div>').appendTo(rel);
                }
            } else {
                $helper.remove();
            }
        },

        _getOverSortBox: function ($sortBox, $item) {
            var itemPos = $item.offset();
            var y = itemPos.top + ($item.height() / 2), x = itemPos.left + ($item.width() / 2);
            return $sortBox.filter(':visible').filter(function () {
                var $sortBox = $(this), sortBoxPos = $sortBox.offset(),
                    sortBoxH = $sortBox.height(), sortBoxW = $sortBox.width();
                return DWZ.isOver(y, x, sortBoxPos.top, sortBoxPos.left, sortBoxH, sortBoxW);
            });
        },
        _createPlaceholder: function ($item) {
            return $('<' + $item[0].nodeName + ' class="sortDragPlaceholder"/>').css({
                height: $item.outerHeight() + 'px',
                marginTop: $item.css('marginTop'),
                marginRight: $item.css('marginRight'),
                marginBottom: $item.css('marginBottom'),
                marginLeft: $item.css('marginLeft')
            });
        },
        startSortDrag: function ($sortBox, $item, event, op) {
            var $placeholder = this._createPlaceholder($item);
            var $helper = $item.clone();
            var position = $item.position();
            $helper.data('$sortBox', $sortBox).data('op', op).data('$item', $item).data('$placeholder', $placeholder);
            $helper.addClass('sortDragHelper').css({
                position: 'absolute',
                top: position.top + $sortBox.scrollTop(),
                left: position.left,
                zIndex: op.zIndex,
                width: $item.width() + 'px',
                height: $item.height() + 'px'
            }).jDrag({
                drag: this.dragSortDrag,
                stop: this.stopSortDrag,
                event: event
            });

            $item.before($helper).before($placeholder);
            return false;
        },
        dragSortDrag: function (el, event) {
            var $helper = $(arguments[0]), $sortBox = $helper.data('$sortBox'),
                $placeholder = $helper.data('$placeholder');

            // 修复出现滚动条拖拽位置
            var $unitBox = $helper.parents(".unitBox:first"),
                position = $helper.position();
            $helper.css({
                top: position.top + $unitBox.scrollTop()
            });
            var $dragList = $($sortBox.attr('drag-rel'));
            for (var i = 0; i < $dragList.length; i++) {
                var $overBox = DWZ.miscDrag._getOverSortBox($dragList.eq(i), $helper);
                if ($overBox.length > 0 && $overBox[0] != $sortBox[0] && (!$overBox.data("accept") || -1 < $overBox.data("accept").split(",").indexOf($helper.data("type")) )) { //移动到其他容器
                    $placeholder.appendTo($overBox);
                }
            }

        },
        stopSortDrag: function () {
            var $helper = $(arguments[0]), $sortBox = $helper.data('$sortBox'),
                $placeholder = $helper.data('$placeholder'), $item = $helper.data('$item');

            if ($placeholder && $placeholder.is(':visible')) {
                //复制到目标容器
                var $destBox = $placeholder.parents(".sortDrag:first");
                var html = $helper.html();

                $destBox.append('<div class="dragItem" data-id="' + $helper.data('id') + '" data-type="' + $helper.data('type') + '">' + html + '</div>');

                $placeholder.remove();
                $helper.remove();
                if ($sortBox.data('duplicate') != 1) {
                    $item.remove();
                }

                //从新绑定sortDrag
                if ($.fn.sortDrag) {
                    $destBox.sortDrag({refresh: true});
                }
            } else {
                $placeholder.remove();
                $helper.remove();
            }
        }
    };

    $.fn.extend({
        miscDrag: function (options) {
            var op = $.extend({
                cursor: 'move', // selector 的鼠标手势
                sortBoxs: 'div.miscDrag', //拖动排序项父容器
                replace: false, //2个sortBox之间拖动替换
                items: '> dt .dragBox', //拖动排序项选择器
                zIndex: 1000
            }, options);

            return this.each(function () {
                var $box = $(this);
                $box.find(op.items).each(function (i) {
                    var $item = $(this);
                    $item.mousedown(function (event) {
                        DWZ.miscDrag.start($box, $item, event, op);
                        event.preventDefault();
                    });
                });
            });
        },
        miscDragData: function () {
            var $miscDrag = $(this),
                $miscSortDrag = $($miscDrag.attr('rel')),
                $dragBoxList = $miscDrag.find('dd .dragBox'),
                $sortDragList = $miscSortDrag.find('.sortDrag');

            var data = [];
            for (var i = 0; i < $dragBoxList.length; i++) {
                var $dragBox = $dragBoxList.eq(i), $sortDrag = $sortDragList.eq(i),
                    $dragBoxPos = $dragBox.position();

                var dataItem = {
                    id: $dragBox.data('id'),
                    top: parseInt($dragBoxPos.top),
                    left: parseInt($dragBoxPos.left),
                    items: []
                };

                $sortDrag.find('.dragItem').each(function (index) {
                    var $dragItem = $(this),
                        $dragItemPos = $dragItem.position();
                    dataItem.items.push({
                        id: $dragItem.data('id')
                    });
                });

                data.push(dataItem)
            }

            return data;
        },

        miscSortDragData: function () {
            var $miscSortDrag = $(this),
                $sortDragList = $miscSortDrag.find('.sortDrag[data-parent='+$miscSortDrag.data('id')+']');
            function fillData($sortDragList){
                var data = [];
                for (var i = 0; i < $sortDragList.length; i++) {
                    var $sortDrag = $sortDragList.eq(i)
                    var dataItem = {
                        items: []
                    };

                    if($sortDrag.data('id')){
                        dataItem.id=$sortDrag.data('id');
                    }

                    $sortDrag.find('>.dragItem').each(function () {
                        var $dragItem = $(this);
                        var itemData = {
                            id: $dragItem.data('id')
                        };

                        $dragItem.find('.ctl-label :input').each(function () {
                            var $lable = $(this), lableName = $lable.data('name');
                            if (lableName) {
                                if("checkbox"==$lable .attr("type")){
                                    itemData[lableName] = $lable.is(":checked");
                                } else {
                                    itemData[lableName] = $lable.val();
                                }
                            }
                        });
                        $dragItemSortDragList=$dragItem.find('>.dragContent .sortDrag');
                        if($dragItemSortDragList.length){
                            itemData.items = fillData($dragItemSortDragList);
                        }
                        dataItem.items.push(itemData);
                    });
                    data.push(dataItem);
                }
                return data;
            }

            return fillData($sortDragList);
        },

        miscSortDrag: function (options) {
            var op = $.extend({
                cursor: 'move', // selector 的鼠标手势
                sortBoxs: 'dl.miscSortDrag', //拖动排序项父容器
                replace: true, //2个sortBox之间拖动替换
                items: '> dt .dragItem', //拖动排序项选择器
                zIndex: 1000
            }, options);

            return this.each(function () {

                var $sortBox = $(this);
                $sortBox.find(op.items).each(function (i) {
                    var $item = $(this);
                    $item.mousedown(function (event) {
                        DWZ.miscDrag.startSortDrag($sortBox, $item, event, op);
                        event.preventDefault();
                    });
                });

            });
        }
    });
})(jQuery);
/**
 * Theme Plugins
 *
 * @author ZhangHuihua@msn.com
 */
( function($) {
    $.fn.extend({
        cssTable: function(options) {
            return this.each(function() {
                var $this = $(this);
                var $trs = $this.find('tbody>tr');
                var $grid = $this.parent(); // table

                $trs.each(function(index) {
                    var $tr = $(this);
                    $tr.click(function() {
                        $trs.filter(".selected").removeClass("selected");
                        $tr.addClass("selected");
                        var sTarget = $tr.attr("target");
                        if (sTarget ) {
                            if ($("#" + sTarget, $grid).size() == 0 ) {
                                $grid.prepend('<input id="' + sTarget + '" type="hidden" />');
                            }
                            $("#" + sTarget, $grid).val($tr.attr("rel"));
                        }
                    });
                    if ($(".edit", $tr).length) {
                        $tr.dblclick(function() {
                            $(".edit:eq(0)", $tr).click();
                        });
                    } else if ($(".panelBar .icon-edit", ( !$.pdialog.getCurrent() ) ? navTab.getCurrentPanel(): $.pdialog.getCurrent()).length ) {
                        $tr.dblclick(function() {
                            $(".panelBar .icon-edit:eq(0)", ( !$.pdialog.getCurrent() ) ? navTab.getCurrentPanel(): $.pdialog.getCurrent()).parent().click();
                        });
                    }
                });
                $this.find("thead [orderField]").orderBy({
                    targetType: $this.attr("targetType"), rel: $this.attr("rel"), asc: $this.attr("asc") || "asc", desc: $this.attr("desc") || "desc"
                });
            });
        }
    });
} )(jQuery);
/**
 * @author Roger Wu v1.0
 * @author ZhangHuihua@msn.com 2011-4-1
 */
(function($){
    $.fn.jTable = function(options){
        return this.each(function(){
            var $table = $(this), nowrapTD = $table.attr("nowrapTD");
            var tlength = $table.width();
            var aStyles = [];
            var $tc = $table.parent().addClass("j-resizeGrid"); // table parent container
            var oldThs = $table.find("thead>tr:last-child").find("th");

            for(var i = 0, l = oldThs.size(); i < l; i++) {
                var $th = $(oldThs[i]);
                var style = [], width = $th.innerWidth() - (100 * $th.innerWidth() / tlength)-2;
                style[0] = parseInt(width);
                style[1] = $th.attr("align");
                aStyles[aStyles.length] = style;
            }
            $(this).wrap("<div class='grid'></div>");
            var $grid = $table.parent().html($table.html());
            var thead = $grid.find("thead");
            thead.wrap("<div class='gridHeader'><div class='gridThead'><table style='width:" + (tlength - 20) + "px;'></table></div></div>");
            var lastH = $(">tr:last-child", thead);
            var ths = $(">th", lastH);
            $("th",thead).each(function(){
                var $th = $(this);
                $th.html("<div class='gridCol' title='"+$th.text()+"'>"+ $th.html() +"</div>");
            });

            ths.each(function(i){
                var $th = $(this), style = aStyles[i];
                $th.addClass(style[1]).removeAttr("align").removeAttr("width").width(style[0]);
            }).filter("[orderField]").orderBy({
                targetType: $table.attr("targetType"),
                rel:$table.attr("rel"),
                asc: $table.attr("asc") || "asc",
                desc:  $table.attr("desc") || "desc"
            });

            var tbody = $grid.find(">tbody");
            tbody.wrap("<div class='gridScroller' layoutH style='width:" + $tc.width() + "px;'><div class='gridTbody'><table style='width:" + (tlength - 20) + "px;'></table></div></div>");
            var ftr = $(">tr:first-child", tbody);
            var $trs = tbody.find('>tr');

            $trs.each(function(){
                var $tr = $(this);
                var $ftds = $(">td", this);

                for (var i=0; i < $ftds.size(); i++) {
                    var $ftd = $($ftds[i]);
                    if (nowrapTD != "false") $ftd.html("<div>" + $ftd.html() + "</div>");
                    if (i < aStyles.length) $ftd.addClass(aStyles[i][1]);
                }
                $tr.click(function(){
                    $trs.filter(".selected").removeClass("selected");
                    $tr.addClass("selected");
                    var sTarget = $tr.attr("target");
                    if (sTarget) {
                        if ($("#"+sTarget, $grid).size() == 0) {
                            $grid.prepend('<input id="'+sTarget+'" type="hidden" />');
                        }
                        $("#"+sTarget, $grid).val($tr.attr("rel"));
                    }
                });
                if ($(".edit", $tr).length) {
                    $tr.dblclick(function() {
                        $(".edit:eq(0)", $tr).click();
                    });
                } else if ($(".icon-edit", ( !$.pdialog.getCurrent() ) ? navTab.getCurrentPanel(): $.pdialog.getCurrent()).length ) {
                    $tr.dblclick(function() {
                        $(".icon-edit:eq(0)", ( !$.pdialog.getCurrent() ) ? navTab.getCurrentPanel(): $.pdialog.getCurrent()).parent().click();
                    });
                }
            });

            $(">td",ftr).each(function(i){
                if (i < aStyles.length) $(this).width(aStyles[i][0]);
            });
            $grid.append("<div class='resizeMarker' style='height:300px; left:57px;display:none;'></div><div class='resizeProxy' style='height:300px; left:377px;display:none;'></div>");

            var scroller = $(".gridScroller", $grid);
            scroller.scroll(function(event){
                var header = $(".gridThead", $grid);
                if(scroller.scrollLeft() > 0){
                    header.css("position", "relative");
                    var scroll = scroller.scrollLeft();
                    header.css("left", scroller.cssv("left") - scroll);
                }
                if(scroller.scrollLeft() == 0) {
                    header.css("position", "relative");
                    header.css("left", "0px");
                }
                return false;
            });


            $(">tr", thead).each(function(){

                $(">th", this).each(function(i){
                    var th = this, $th = $(this);
                    $th.mouseover(function(event){
                        var offset = $.jTableTool.getOffset(th, event).offsetX;
                        if($th.outerWidth() - offset < 5) {
                            $th.css("cursor", "col-resize").mousedown(function(event){
                                $(".resizeProxy", $grid).show().css({
                                    left: $.jTableTool.getRight(th)- $(".gridScroller", $grid).scrollLeft(),
                                    top:$.jTableTool.getTop(th),
                                    height:$.jTableTool.getHeight(th,$grid),
                                    cursor:"col-resize"
                                });
                                $(".resizeMarker", $grid).show().css({
                                        left: $.jTableTool.getLeft(th) + 1 - $(".gridScroller", $grid).scrollLeft(),
                                        top: $.jTableTool.getTop(th),
                                        height:$.jTableTool.getHeight(th,$grid)
                                });
                                $(".resizeProxy", $grid).jDrag($.extend(options, {scop:true, cellMinW:20, relObj:$(".resizeMarker", $grid)[0],
                                        move: "horizontal",
                                        event:event,
                                        stop: function(){
                                            var pleft = $(".resizeProxy", $grid).position().left;
                                            var mleft = $(".resizeMarker", $grid).position().left;
                                            var move = pleft - mleft - $th.outerWidth() -9;

                                            var cols = $.jTableTool.getColspan($th);
                                            var cellNum = $.jTableTool.getCellNum($th);
                                            var oldW = $th.width(), newW = $th.width() + move;
                                            var $dcell = $(">td", ftr).eq(cellNum - 1);

                                            $th.width(newW + "px");
                                            $dcell.width(newW+"px");

                                            var $table1 = $(thead).parent();
                                            $table1.width(($table1.width() - oldW + newW)+"px");
                                            var $table2 = $(tbody).parent();
                                            $table2.width(($table2.width() - oldW + newW)+"px");

                                            $(".resizeMarker,.resizeProxy", $grid).hide();
                                        }
                                    })
                                );
                            });
                        } else {
                            $th.css("cursor", $th.attr("orderField") ? "pointer" : "default");
                            $th.unbind("mousedown");
                        }
                        return false;
                    });
                });
            });

            function _resizeGrid(){
                $("div.j-resizeGrid").each(function(){
                    var width = $(this).innerWidth();
                    if (width){
                        $("div.gridScroller", this).width(width+"px");
                        if(width -20 > $("div.gridHeader>.gridThead>table", this).width()) {
                            $("div.gridHeader>.gridThead>table", this).width((width - 20 )+"px");
                            $("div.gridScroller>.gridTbody>table", this).width((width - 20 )+"px");
                        }
                    }
                });
            }
            $(window).unbind(DWZ.eventType.resizeGrid).bind("resizeGrid", _resizeGrid);
        });
    };


    $.jTableTool = {
        getLeft:function(obj) {
            var width = 0;
            $(obj).prevAll().each(function(){
                width += $(this).outerWidth();
            });
            return width - 1;
        },
        getRight:function(obj) {
            var width = 0;
            $(obj).prevAll().andSelf().each(function(){
                width += $(this).outerWidth();
            });
            return width - 1;
        },
        getTop:function(obj) {
            var height = 0;
            $(obj).parent().prevAll().each(function(){
                height += $(this).outerHeight();
            });
            return height;
        },
        getHeight:function(obj, parent) {
            var height = 0;
            var head = $(obj).parent();
            head.nextAll().andSelf().each(function(){
                height += $(this).outerHeight();
            });
            $(".gridTbody", parent).children().each(function(){
                height += $(this).outerHeight();
            });
            return height;
        },
        getCellNum:function(obj) {
            return $(obj).prevAll().andSelf().size();
        },
        getColspan:function(obj) {
            return $(obj).attr("colspan") || 1;
        },
        getStart:function(obj) {
            var start = 1;
            $(obj).prevAll().each(function(){
                start += parseInt($(this).attr("colspan") || 1);
            });
            return start;
        },
        getPageCoord:function(element){
            var coord = {x: 0, y: 0};
            while (element){
                coord.x += element.offsetLeft;
                coord.y += element.offsetTop;
                element = element.offsetParent;
            }
            return coord;
        },
        getOffset:function(obj, evt){
            if(/msie/.test(navigator.userAgent.toLowerCase())) {
                var objset = $(obj).offset();
                var evtset = {
                    offsetX:evt.pageX || evt.screenX,
                    offsetY:evt.pageY || evt.screenY
                };
                var offset ={
                    offsetX: evtset.offsetX - objset.left,
                    offsetY: evtset.offsetY - objset.top
                };
                return offset;
            }
            var target = evt.target;
            if (target.offsetLeft == undefined){
                target = target.parentNode;
            }
            var pageCoord = $.jTableTool.getPageCoord(target);
            var eventCoord ={
                x: window.pageXOffset + evt.clientX,
                y: window.pageYOffset + evt.clientY
            };
            var offset ={
                offsetX: eventCoord.x - pageCoord.x,
                offsetY: eventCoord.y - pageCoord.y
            };
            return offset;
        }
    };
})(jQuery);


/**
 * @author Roger Wu
 * @version 1.0
 */
( function($) {
    $.fn.extend({
        jTask: function(options) {
            return this.each(function() {
                var $task = $(this);
                var id = $task.attr("id");
                $task.click(function(e) {
                    var dialog = $("body").data(id);
                    if ($task.hasClass("selected") ) {
                        $("a.minimize", dialog).trigger("click");
                    } else {
                        if ($(dialog).is(":hidden") ) {
                            $.taskBar.restoreDialog(dialog);
                        } else {
                            $(dialog).trigger("click");
                        }
                    }
                    $.taskBar.scrollCurrent($(this));
                    return false;
                });
                $("div.close", $task).click(function(e) {
                    $.pdialog.close(id)
                    return false;
                });
            });
        }
    });
    $.taskBar = {
        _taskBar: null ,
        _taskBox: null ,
        _prevBut: null ,
        _nextBut: null ,
        _op: {
            id: "taskbar", taskBox: "div.taskbarContent", prevBut: ".taskbarLeft", prevDis: "taskbarLeftDisabled", nextBut: ".taskbarRight" ,
            nextDis: "taskbarRightDisabled", selected: "selected", boxMargin: "taskbarMargin"
        },
        init: function(options) {
            var $this = this;
            $.extend(this._op, options);
            this._taskBar = $("#" + this._op.id);
            if (this._taskBar.size() == 0 ) {
                this._taskBar = $($.parseHTML(DWZ.frag["taskbar"], document, true)).appendTo($("body"));
                this._taskBar.find(".taskbarLeft");
                this._taskBar.find(".taskbarRight");
            }
            this._taskBox = this._taskBar.find(this._op.taskBox);
            this._taskList = this._taskBox.find(">ul");
            this._prevBut = this._taskBar.find(this._op.prevBut);
            this._nextBut = this._taskBar.find(this._op.nextBut);
            this._prevBut.click(function(e) {
                $this.scrollLeft()
            });
            this._nextBut.click(function(e) {
                $this.scrollRight()
            });

            this._contextmenu(this._taskBox); // taskBar右键菜单
        },
        _contextmenu: function(obj) {
            $(obj).contextMenu('dialogCM', {
                bindings: {
                    closeCurrent: function(t, m) {
                        var obj = t.isTag("li") ? t: $.taskBar._getCurrent();
                        $("div.close", obj).trigger("click");
                    }, closeOther: function(t, m) {
                        var selector = t.isTag("li") ? ( "#" + t.attr("id") ): ".selected";
                        var tasks = $.taskBar._taskList.find(">li:not(:" + selector + ")");
                        tasks.each(function(i) {
                            $("div.close", tasks[i]).trigger("click");
                        });
                    }, closeAll: function(t, m) {
                        var tasks = $.taskBar._getTasks();
                        tasks.each(function(i) {
                            $("div.close", tasks[i]).trigger("click");
                        });
                    }
                }, ctrSub: function(t, m) {
                    var mCur = m.find("[rel='closeCurrent']");
                    var mOther = m.find("[rel='closeOther']");
                    if (!$.taskBar._getCurrent()[0] ) {
                        mCur.addClass("disabled");
                        mOther.addClass("disabled");
                    } else {
                        if ($.taskBar._getTasks().size() == 1 ) {
                            mOther.addClass("disabled");
                        }
                    }
                }
            });
        },
        _scrollCurrent: function() {
            var iW = this._tasksW(this._getTasks());
            if (iW > this._getTaskBarW() ) {
                var $this = this;
                var lTask = $(">li:last-child", this._taskList);
                var left = this._getTaskBarW() - lTask.position().left - lTask.outerWidth(true);
                this._taskList.animate({
                    left: left + 'px'
                }, 200, function() {
                    $this._ctrlScrollBut();
                });
            } else {
                this._ctrlScrollBut();
            }
        },
        _getTaskBarW: function() {
            return this._taskBox.width() - ( this._prevBut.is(":hidden") ? this._prevBut.width() + 2: 0 ) - ( this._nextBut.is(":hidden") ? this._nextBut.width() + 2: 0 );
        },
        _scrollTask: function(task) {
            var $this = this;
            if (task.position().left + this._getLeft() + task.outerWidth() > this._getBarWidth() ) {
                var left = this._getTaskBarW() - task.position().left - task.outerWidth(true) - 2;
                this._taskList.animate({
                    left: left + 'px'
                }, 200, function() {
                    $this._ctrlScrollBut();
                });
            } else if (task.position().left + this._getLeft() < 0 ) {
                var left = this._getLeft() - ( task.position().left + this._getLeft() );
                this._taskList.animate({
                    left: left + 'px'
                }, 200, function() {
                    $this._ctrlScrollBut();
                });
            }
        } ,
        /**
         * 控制左右移动按钮何时显示与隐藏
         */
        _ctrlScrollBut: function() {
            var iW = this._tasksW(this._getTasks());
            if (this._getTaskBarW() > iW ) {
                this._taskBox.removeClass(this._op.boxMargin);
                this._nextBut.hide();
                this._prevBut.hide();
                if (this._getTasks().eq(0)[0] ) {
                    this._scrollTask(this._getTasks().eq(0));
                }
            } else {
                this._taskBox.addClass(this._op.boxMargin);
                this._nextBut.show().removeClass(this._op.nextDis);
                this._prevBut.show().removeClass(this._op.prevDis);
                if (this._getLeft() >= 0 ) {
                    this._prevBut.addClass(this._op.prevDis);
                }
                if (this._getLeft() <= this._getTaskBarW() - iW ) {
                    this._nextBut.addClass(this._op.nextDis);
                }
            }
        } ,
        _getLeft: function() {
            return this._taskList.position().left;
        } ,
        /**
         * 取得第一个完全显示在taskbar上的任务
         */
        _visibleStart: function() {
            var iLeft = this._getLeft();
            var jTasks = this._getTasks();
            for (var i = 0; i < jTasks.size(); i++) {
                if (jTasks.eq(i).position().left + jTasks.eq(i).outerWidth(true) + iLeft >= 0 ) {
                    return jTasks.eq(i);
                }
            }
            return jTasks.eq(0);
        } ,
        /**
         * 取得最后一个完全显示在taskbar上的任务
         */
        _visibleEnd: function() {
            var iLeft = this._getLeft();
            var jTasks = this._getTasks();
            for (var i = 0; i < jTasks.size(); i++) {
                if (jTasks.eq(i).position().left + jTasks.eq(i).outerWidth(true) + iLeft > this._getBarWidth() ) {
                    return jTasks.eq(i);
                }
            }
            return jTasks.eq(jTasks.size() - 1);
        } ,
        /**
         * 取得所有的任务
         */
        _getTasks: function() {
            return this._taskList.find(">li");
        } ,
        /**
         * 计算所传入的所有任务的宽度和
         *
         * @param {Object}
         *            jTasks
         */
        _tasksW: function(jTasks) {
            var iW = 0;
            jTasks.each(function() {
                iW += $(this).outerWidth(true);
            });
            return iW;
        },
        _getBarWidth: function() {
            return this._taskBar.innerWidth();
        } ,
        /**
         * 在任务栏上新加一个任务
         *
         * @param {Object}
         *            id
         * @param {Object}
         *            title
         */
        addDialog: function(id, title) {
            this.show();
            var task = $("#" + id, this._taskList);
            if (!task[0] ) {
                var taskFrag = '<li id="#taskid#"><div class="taskbutton">#title#</div><div class="close"><i class="icon-remove"></i></div></li>';
                this._taskList.append(taskFrag.replace("#taskid#", id).replace("#title#", title));
                task = $("#" + id, this._taskList);
                task.jTask();
            } else {
                $(">div.taskbutton", task).text(title);
            }
            this._contextmenu(task);
            this.switchTask(id);
            this._scrollTask(task);
        } ,
        /**
         * 关闭一个任务
         *
         * @param {Object}
         *            id
         */
        closeDialog: function(obj) {
            var task = ( typeof obj == 'string' ) ? $("#" + obj, this._taskList): obj;
            task.remove();
            if (this._getTasks().size() == 0 ) {
                this.hide();
            }
            this._scrollCurrent();
        } ,
        /**
         * @param {Object}
         *            id or dialog
         */
        restoreDialog: function(obj) {
            var dialog = ( typeof obj == 'string' ) ? $("body").data(obj): obj;
            var id = ( typeof obj == 'string' ) ? obj: dialog.data("id");
            var task = $.taskBar.getTask(id);
            $(".resizable").css({
                top: $(window).height() - 60, left: $(task).position().left, height: $(task).outerHeight(), width: $(task).outerWidth()
            }).show().animate({
                top: $(dialog).css("top"), left: $(dialog).css("left"), width: $(dialog).css("width"), height: $(dialog).css("height")
            }, 250, function() {
                $(this).hide();
                $(dialog).show();
                $.pdialog._current = dialog;
            });
            $.taskBar.switchTask(id);
        } ,
        /**
         * 把任务变成不是当前的
         *
         * @param {Object}
         *            id
         */
        inactive: function(id) {
            $("#" + id, this._taskList).removeClass("selected");
        } ,
        /**
         * 向左移一个任务
         */
        scrollLeft: function() {
            var task = this._visibleStart();
            this._scrollTask(task);
        } ,
        /**
         * 向右移一个任务
         */
        scrollRight: function() {
            var task = this._visibleEnd();
            this._scrollTask(task);
        } ,
        /**
         * 移出当前点击的任务
         *
         * @param {Object}
         *            task
         */
        scrollCurrent: function(task) {
            this._scrollTask(task);
        } ,
        /**
         * 切换任务
         *
         * @param {Object}
         *            id
         */
        switchTask: function(id) {
            this._getCurrent().removeClass("selected");
            this.getTask(id).addClass("selected");
        }, _getCurrent: function() {
            return this._taskList.find(">.selected");
        }, getTask: function(id) {
            return $("#" + id, this._taskList);
        } ,
        /**
         * 显示任务栏
         */
        show: function() {
            if (this._taskBar.is(":hidden") ) {
                this._taskBar.css("top", $(window).height() - 34 + this._taskBar.outerHeight()).show();
                this._taskBar.animate({
                    top: $(window).height() - this._taskBar.outerHeight()
                }, 500);
            }
        } ,
        /**
         * 隐藏任务栏
         */
        hide: function() {
            this._taskBar.animate({
                top: $(window).height() - 29 + this._taskBar.outerHeight(true)
            }, 500, function() {
                $.taskBar._taskBar.hide();
            });
        }
    }
} )(jQuery);
/**
 * html转义
 * @param sHtml
 * @returns
 */
function html2Escape(sHtml) {
    return Base64.encode(sHtml);
}
/**
 * @author ZhangHuihua@msn.com
 */

/**
 * 普通ajax表单提交
 *
 * @param {Object}
 *            form
 * @param {Object}
 *            callback
 * @param {String}
 *            confirmMsg 提示确认信息
 */
function validateCallback(form, callback, confirmMsg) {
    var $form = $(form);
    $("textarea.editor", $form).each(function() {
        if('ckeditor'==$(this).attr('editorType')) {
            CKEDITOR.instances[$(this).data("id")].updateElement();
        } else if ("kindeditor"==$(this).attr("editorType")){
            KindEditor.sync('#'+$(this).data("id"));
        } else {
            UE.instants[$(this).data("id")].sync();
        }
        if('true'==$(this).attr('escape')){
            $(this).val(html2Escape($(this).val()));
        }
    });
    $("input[escape=true]", $form).each(function() {
        if($(this).val()){
          $(this).attr('maxlength',128);
          $(this).val(sha512($(this).val()));
        }
    });
    $("textarea.code", $form).each(function() {
         $(this).val(DWZ.instances[$(this).data("id")].getValue());
         if('true'==$(this).attr('escape')){
             $(this).val(html2Escape($(this).val()));
         }
    });

    $(".miscSortDrag", $form).each(function() {
        var $sortBox=$(this);
        if($sortBox.data("result")){
            $sortBox.find($sortBox.data("result")).val(DWZ.obj2str($sortBox.miscSortDragData()));
        }
    });
    
    if (!$form.valid() ) {
        return false;
    }
    var _submitFn = function() {
        $.ajax({
            type: form.method || 'POST', url: $form.attr("action"), data: $form.serializeArray(), dataType: "json", cache: false, success: callback || DWZ.ajaxDone ,
            error: DWZ.ajaxError
        });
    }
    if (confirmMsg ) {
        alertMsg.confirm(confirmMsg, {
            okCall: _submitFn
        });
    } else {
        _submitFn();
    }
    return false;
}
/**
 * 带文件上传的ajax表单提交
 *
 * @param {Object}
 *            form
 * @param {Object}
 *            callback
 */
function iframeCallback(form, callback) {
    var $form = $(form), $iframe = $("#callbackframe");
    if (!$form.valid() ) {
        return false;
    }
    if ($iframe.size() == 0 ) {
        $iframe = $($.parseHTML("<iframe id='callbackframe' name='callbackframe' src='about:blank' style='display:none'></iframe>", document, true)).appendTo("body");
    }
    if (!form.ajax ) {
        $form.append('<input type="hidden" name="ajax" value="1" />');
    }
    form.target = "callbackframe";
    _iframeResponse($iframe[0], callback || DWZ.ajaxDone);
}
function _iframeResponse(iframe, callback) {
    var $iframe = $(iframe), $document = $(document);
    $document.trigger("ajaxStart");
    $iframe.bind("load", function(event) {
        $iframe.unbind("load");
        $document.trigger("ajaxStop");

        if (iframe.src == "javascript:'%3Chtml%3E%3C/html%3E';" || // For
        // Safari
        iframe.src == "javascript:'<html></html>';" ) { // For FF, IE
            return;
        }
        var doc = iframe.contentDocument || iframe.document;

        // fixing Opera 9.26,10.00
        if (doc.readyState && doc.readyState != 'complete' ) {
            return;
        }
        // fixing Opera 9.64
        if (doc.body && doc.body.innerHTML == "false" ) {
            return;
        }
        var response;
        if (doc.XMLDocument ) {
            // response is a xml document Internet Explorer property
            response = doc.XMLDocument;
        } else if (doc.body ) {
            try {
                response = $iframe.contents().find("body").text();
                response = $.parseJSON(response);
            } catch (e) { // response is html document or plain text
                response = doc.body.innerHTML;
            }
        } else {
            // response is a xml document
            response = doc;
        }
        callback(response);
    });
}

/**
 * navTabAjaxDone是DWZ框架中预定义的表单提交回调函数． 服务器转回navTabId可以把那个navTab标记为reloadFlag=1,
 * 下次切换到那个navTab时会重新载入内容. callbackType如果是closeCurrent就会关闭当前tab
 * 只有callbackType="forward"时需要forwardUrl值
 * navTabAjaxDone这个回调函数基本可以通用了，如果还有特殊需要也可以自定义回调函数. 如果表单提交只提示操作是否成功, 就可以不指定回调函数.
 * 框架会默认调用DWZ.ajaxDone() <form action="/user.do?method=save" onsubmit="return
 * validateCallback(this, navTabAjaxDone)">
 * form提交后返回json数据结构statusCode=DWZ.statusCode.ok表示操作成功, 做页面跳转等操作.
 * statusCode=DWZ.statusCode.error表示操作失败, 提示错误原因.
 * statusCode=DWZ.statusCode.timeout表示session超时，下次点击时跳转到DWZ.loginUrl
 * {"statusCode":"200", "message":"操作成功", "navTabId":"navNewsLi",
 * "forwardUrl":"", "callbackType":"closeCurrent", "rel"."xxxId"}
 * {"statusCode":"300", "message":"操作失败"} {"statusCode":"301", "message":"会话超时"}
 */
function navTabAjaxDone(json) {
    DWZ.ajaxDone(json);
    if (json[DWZ.keys.statusCode] == DWZ.statusCode.ok ) {
        if (json.navTabId ) { // 把指定navTab页面标记为需要“重新载入”。注意navTabId不能是当前navTab页面的
            if('page' == json.rel){
                navTab.reloadFlag(json.navTabId, 2);
            }else{
                navTab.reloadFlag(json.navTabId);
            }
        } else { // 重新载入当前navTab页面
            var $pagerForm = $(".pagerForm", navTab.getCurrentPanel());
            if(0!=$pagerForm.length){
                $pagerForm.submit();
            }
        }
        if ("closeCurrent" == json.callbackType ) {
            setTimeout(function() {
                navTab.closeCurrentTab(json.navTabId);
            }, 100);
        } else if ("forward" == json.callbackType ) {
            if (json.navTabId ) {
                navTab.reload(json.forwardUrl, {
                    navTabId: json.navTabId
                });
            }else{
                navTab.reload(json.forwardUrl);
            }
        } else if ("forwardConfirm" == json.callbackType ) {
            alertMsg.confirm(json.confirmMsg || DWZ.msg("forwardConfirmMsg"), {
                okCall: function() {
                    navTab.reload(json.forwardUrl);
                }, cancelCall: function() {
                    navTab.closeCurrentTab(json.navTabId);
                }
            });
        }
    }
}

/**
 * dialog上的表单提交回调函数 当前navTab页面有pagerForm就重新加载 服务器转回navTabId，可以重新载入指定的navTab.
 * statusCode=DWZ.statusCode.ok表示操作成功, 自动关闭当前dialog
 * form提交后返回json数据结构,json格式和navTabAjaxDone一致
 */
function dialogAjaxDone(json) {
    DWZ.ajaxDone(json);
    if (json[DWZ.keys.statusCode] == DWZ.statusCode.ok ) {
        if (json.navTabId ) {
            navTab.reload(json.forwardUrl, {
                navTabId: json.navTabId
            });
        } else {
            var $panel = navTab.getCurrentPanel();
            var $pagerForm = $(".pagerForm", navTab.getCurrentPanel());
            if(0!=$pagerForm.length){
                $pagerForm.submit();
            }
        }
        if ("closeCurrent" == json.callbackType ) {
            $.pdialog.closeCurrent();
        }
    }
}

/**
 * 处理navTab上的查询, 会重新载入当前navTab
 *
 * @param {Object}
 *            form
 */
function navTabSearch(form, navTabId) {
    var $form = $(form);
    navTab.reload($form.attr('action'), {
        data: $form.serializeArray(), navTabId: navTabId
    });
    return false;
}
/**
 * 处理dialog弹出层上的查询, 会重新载入当前dialog
 *
 * @param {Object}
 *            form
 */
function dialogSearch(form) {
    var $form = $(form);
    if (form[DWZ.pageInfo.pageNum] ) {
        form[DWZ.pageInfo.pageNum].value = 1;
    }
    $.pdialog.reload($form.attr('action'), {
        data: $form.serializeArray()
    });
    return false;
}
/**
 * 处理div上的局部查询, 会重新载入指定div
 *
 * @param {Object}
 *            form
 */
function divSearch(form, rel) {
    var $form = $(form);
    if (form[DWZ.pageInfo.pageNum] ) {
        form[DWZ.pageInfo.pageNum].value = 1;
    }
    if (rel ) {
        var $box = $("#" + rel);
        $box.ajaxUrl({
            type: "POST", url: $form.attr("action"), data: $form.serializeArray(), callback: function() {
                $box.find("[layoutH]").layoutH();
            }
        });
    }
    return false;
}
/**
 * @param {Object}
 *            args {pageNum:"",numPerPage:"",orderField:"",orderDirection:""}
 * @param String
 *            formId 分页表单选择器，非必填项默认值是 "pagerForm"
 */
function _getPagerForm($parent, args) {
    var form = $(".pagerForm", $parent).get(0);
    if (form ) {
        if (args["pageNum"] ) {
            form[DWZ.pageInfo.pageNum].value = args["pageNum"];
        }
        if (args["numPerPage"] ) {
            form[DWZ.pageInfo.numPerPage].value = args["numPerPage"];
        }
        if (args["orderField"] ) {
            form[DWZ.pageInfo.orderField].value = args["orderField"];
        }
        if (args["orderDirection"] && form[DWZ.pageInfo.orderDirection] ) {
            form[DWZ.pageInfo.orderDirection].value = args["orderDirection"];
        }
    }
    return form;
}

/**
 * 处理navTab中的分页和排序 targetType: navTab 或 dialog rel: 可选 用于局部刷新div id号 data:
 * pagerForm参数 {pageNum:"n", numPerPage:"n", orderField:"xxx",
 * orderDirection:""} callback: 加载完成回调函数
 */
function dwzPageBreak(options) {
    var op = $.extend({
        targetType: "navTab", rel: "", data: {
            pageNum: "", numPerPage: "", orderField: "", orderDirection: ""
        }, callback: null
    }, options);
    var $parent = op.targetType == "dialog" ? $.pdialog.getCurrent(): navTab.getCurrentPanel();
    if (op.rel ) {
        var $box = $parent.find("#" + op.rel);
        var form = _getPagerForm($box, op.data);
        if (form ) {
            $box.ajaxUrl({
                type: "POST", url: $(form).attr("action"), data: $(form).serializeArray(), callback: function() {
                    $box.find("[layoutH]").layoutH();
                }
            });
        }
    } else {
        var form = _getPagerForm($parent, op.data);
        var params = $(form).serializeArray();
        if (op.targetType == "dialog" ) {
            if (form ) {
                $.pdialog.reload($(form).attr("action"), {
                    data: params, callback: op.callback
                });
            }
        } else {
            if (form ) {
                navTab.reload($(form).attr("action"), {
                    data: params, callback: op.callback
                });
            }
        }
    }
}
/**
 * 处理navTab中的分页和排序
 *
 * @param args
 *            {pageNum:"n", numPerPage:"n", orderField:"xxx", orderDirection:""}
 * @param rel：
 *            可选 用于局部刷新div id号
 */
function navTabPageBreak(args, rel) {
    dwzPageBreak({
        targetType: "navTab", rel: rel, data: args
    });
}
/**
 * 处理dialog中的分页和排序 参数同 navTabPageBreak
 */
function dialogPageBreak(args, rel) {
    dwzPageBreak({
        targetType: "dialog", rel: rel, data: args
    });
}
function ajaxTodo(url, callback) {
    var $callback = callback || navTabAjaxDone;
    if (!$.isFunction($callback) ) {
        $callback = eval('(' + callback + ')');
    }
    $.ajax({
        type: 'POST', url: url, dataType: "json", cache: false, success: $callback, error: DWZ.ajaxError
    });
}

function escapeJquery(srcString) {
    var escapseResult = srcString;
    var jsSpecialChars = ["\\", "^", "$", "*", "?", ".", "+", "(", ")", "[",
        "]", "|", "{", "}"];
    var jquerySpecialChars = ["~", "`", "@", "#", "%", "&", "=", "'", "\"",
        ":", ";", "<", ">", ",", "/"];
    for (var i = 0; i < jsSpecialChars.length; i++) {
        escapseResult = escapseResult.replace(new RegExp("\\"
                + jsSpecialChars[i], "g"), "\\"
                + jsSpecialChars[i]);
    }
    for (var i = 0; i < jquerySpecialChars.length; i++) {
        escapseResult = escapseResult.replace(new RegExp(jquerySpecialChars[i],
                "g"), "\\" + jquerySpecialChars[i]);
    }
    return escapseResult;
}


/**
 * http://www.uploadify.com/documentation/uploadify/onqueuecomplete/
 */
function uploadifyQueueComplete(queueData) {
    var msg = "The total number of files uploaded: " + queueData.uploadsSuccessful + "<br/>" + "The total number of errors while uploading: " + queueData.uploadsErrored + "<br/>"
            + "The total number of bytes uploaded: " + queueData.queueBytesUploaded + "<br/>" + "The average speed of all uploaded files: " + queueData.averageSpeed;
    if (queueData.uploadsErrored ) {
        alertMsg.error(msg);
    } else {
        alertMsg.correct(msg);
    }
}
/**
 * http://www.uploadify.com/documentation/uploadify/onuploadsuccess/
 */
function uploadifySuccess(file, data, response) {
    alert(data)
}

/**
 * http://www.uploadify.com/documentation/uploadify/onuploaderror/
 */
function uploadifyError(file, errorCode, errorMsg) {
    alertMsg.error(errorCode + ": " + errorMsg);
}

/**
 * http://www.uploadify.com/documentation/
 *
 * @param {Object}
 *            event
 * @param {Object}
 *            queueID
 * @param {Object}
 *            fileObj
 * @param {Object}
 *            errorObj
 */
function uploadifyError(event, queueId, fileObj, errorObj) {
    alert("event:" + event + "\nqueueId:" + queueId + "\nfileObj.name:" + fileObj.name + "\nerrorObj.type:" + errorObj.type + "\nerrorObj.info:" + errorObj.info);
}
$.fn.extend({
    ajaxTodo: function() {
        return this.each(function() {
            var $this = $(this);
            $this.click(function(event) {
                var url = $this.attr("href").replaceTmById($(event.target).parents(".unitBox:first"));
                DWZ.debug(url);
                if (!url.isFinishedTm() ) {
                    alertMsg.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
                    return false;
                }
                var title = $this.attr("title");
                if (title ) {
                    alertMsg.confirm(title, {
                        okCall: function() {
                            ajaxTodo(url, $this.attr("callback"));
                        }
                    });
                } else {
                    ajaxTodo(url, $this.attr("callback"));
                }
                event.preventDefault();
            });
        });
    }, dwzExport: function() {
        function _doExport($this) {
            var $p = $this.attr("targetType") == "dialog" ? $.pdialog.getCurrent(): navTab.getCurrentPanel();
            var $form = $(".pagerForm", $p);
            var url = $this.attr("href");
            window.location = url + ( url.indexOf('?') == -1 ? "?": "&" ) + $form.serialize();
        }
        return this.each(function() {
            var $this = $(this);
            $this.click(function(event) {
                var title = $this.attr("title");
                if (title ) {
                    alertMsg.confirm(title, {
                        okCall: function() {
                            _doExport($this);
                        }
                    });
                } else {
                    _doExport($this);
                }
                event.preventDefault();
            });
        });
    }
});

/**
 * @author ZhangHuihua@msn.com
 * @param {Object}
 *            opts Several options
 */
( function($) {
    $.fn.extend({
        pagination: function(opts) {
            var setting = {
                first$: "li.j-first", prev$: "li.j-prev", next$: "li.j-next", last$: "li.j-last", nums$: "li.j-num>a", jumpto$: "li.jumpto" ,
                pageNumFrag: '<li class="#liClass#"><a href="javascript:;">#pageNum#</a></li>'
            };
            return this.each(function() {
                var $this = $(this);
                var pc = new Pagination(opts);
                var interval = pc.getInterval();
                var pageNumFrag = '';
                for (var i = interval.start; i < interval.end; i++) {
                    pageNumFrag += setting.pageNumFrag.replaceAll("#pageNum#", i).replaceAll("#liClass#", i == pc.getCurrentPage() ? 'selected j-num': 'j-num');
                }
                $this.html(DWZ.frag.pagination.replaceAll("#pageNumFrag#", pageNumFrag).replaceAll("#currentPage#", pc.getCurrentPage())).find("li");
                var $first = $this.find(setting.first$);
                var $prev = $this.find(setting.prev$);
                var $next = $this.find(setting.next$);
                var $last = $this.find(setting.last$);
                if (pc.hasPrev() ) {
                    $first.add($prev).find(">span").hide();
                    _bindEvent($prev, pc.getCurrentPage() - 1, pc.targetType(), pc.rel());
                    _bindEvent($first, 1, pc.targetType(), pc.rel());
                } else {
                    $first.add($prev).addClass("disabled").find(">a").hide();
                }
                if (pc.hasNext() ) {
                    $next.add($last).find(">span").hide();
                    _bindEvent($next, pc.getCurrentPage() + 1, pc.targetType(), pc.rel());
                    _bindEvent($last, pc.numPages(), pc.targetType(), pc.rel());
                } else {
                    $next.add($last).addClass("disabled").find(">a").hide();
                }
                $this.find(setting.nums$).each(function(i) {
                    _bindEvent($(this), i + interval.start, pc.targetType(), pc.rel());
                });
                $this.find(setting.jumpto$).each(function() {
                    var $this = $(this);
                    var $inputBox = $this.find(":text");
                    var $button = $this.find("a");
                    $button.click(function(event) {
                        var pageNum = $inputBox.val();
                        if (pageNum && pageNum.isPositiveInteger() ) {
                            dwzPageBreak({
                                targetType: pc.targetType(), rel: pc.rel(), data: {
                                    pageNum: pageNum
                                }
                            });
                        }
                    });
                    $inputBox.keyup(function(event) {
                        if (event.keyCode == DWZ.keyCode.ENTER ) {
                            $button.click();
                        }
                    });
                });
            });
            function _bindEvent($target, pageNum, targetType, rel) {
                $target.bind("click", {
                    pageNum: pageNum
                }, function(event) {
                    dwzPageBreak({
                        targetType: targetType, rel: rel, data: {
                            pageNum: event.data.pageNum
                        }
                    });
                    event.preventDefault();
                });
            }
        } ,

        orderBy: function(options) {
            var op = $.extend({
                targetType: "navTab", rel: "", asc: "asc", desc: "desc"
            }, options);
            return this.each(function() {
                var $this = $(this).css({
                    cursor: "pointer"
                }).click(function() {
                    var orderField = $this.attr("orderField");
                    var orderDirection = $this.hasClass(op.asc) ? op.desc: op.asc;
                    dwzPageBreak({
                        targetType: op.targetType, rel: op.rel, data: {
                            orderField: orderField, orderDirection: orderDirection
                        }
                    });
                });
            });
        }
    });
    var Pagination = function(opts) {
        this.opts = $.extend({
            targetType: "navTab", // navTab, dialog
            rel: "", // 用于局部刷新div id号
            totalCount: 0, numPerPage: 10, pageNumShown: 10, currentPage: 1, callback: function() {
                return false;
            }
        }, opts);
    }
    $.extend(Pagination.prototype, {
        targetType: function() {
            return this.opts.targetType
        }, rel: function() {
            return this.opts.rel
        }, numPages: function() {
            return Math.ceil(this.opts.totalCount / this.opts.numPerPage);
        }, getInterval: function() {
            var ne_half = Math.ceil(this.opts.pageNumShown / 2);
            var np = this.numPages();
            var upper_limit = np - this.opts.pageNumShown;
            var start = this.getCurrentPage() > ne_half ? Math.max(Math.min(this.getCurrentPage() - ne_half, upper_limit), 0): 0;
            var end = this.getCurrentPage() > ne_half ? Math.min(this.getCurrentPage() + ne_half, np): Math.min(this.opts.pageNumShown, np);
            return {
                start: start + 1, end: end + 1
            };
        }, getCurrentPage: function() {
            var currentPage = parseInt(this.opts.currentPage);
            if (isNaN(currentPage) ) {
                return 1;
            }
            return currentPage;
        }, hasPrev: function() {
            return this.getCurrentPage() > 1;
        }, hasNext: function() {
            return this.getCurrentPage() < this.numPages();
        }
    });
} )(jQuery);
/**
 * @author ZhangHuihua@msn.com
 */
( function($) {
    var _lookup = {
        currentGroup: "", suffix: "", $target: null, pk: "id", nextButton: null
    };
    var _util = {
        _lookupPrefix: function(key) {
            var strDot = _lookup.currentGroup ? ".": "";
            return _lookup.currentGroup + strDot + key + _lookup.suffix;
        }, lookupPk: function(key) {
            return this._lookupPrefix(key);
        }, lookupField: function(key) {
            return this.lookupPk(key);
        }
    };
    $.extend({
        bringBackSuggest: function(args) {
            var $box = _lookup['$target'].parents(".unitBox:first");
            $box.find(":input").each(function() {
                var $input = $(this), inputName = $input.attr("name");
                for ( var key in args) {
                    var name = ( _lookup.pk == key ) ? _util.lookupPk(key): _util.lookupField(key);
                    if (name == inputName && "" != name ) {
                        if($input.hasClass('editor')){
                            if('ckeditor'==$input.attr('editorType')) {
                                CKEDITOR.instances[$input.data("id")].setDate(args[key]);
                            } else if ("kindeditor"==$input.attr("editorType")){
                                KindEditor.html('#'+$input.data("id"),args[key]);
                            } else {
                                UE.instants[$input.data("id")].setContent(args[key]);
                            }
                        } else {
                            $input.val(args[key]).trigger('change');
                        }
                        break;
                    }
                }
            });
        },
        bringBack: function(json) {
            if (json[DWZ.keys.statusCode] == DWZ.statusCode.error ) {
                if (json[DWZ.keys.message] ) {
                    alertMsg.error(json[DWZ.keys.message]);
                }
            } else if (json[DWZ.keys.statusCode] == DWZ.statusCode.timeout ) {
                alertMsg.error(json[DWZ.keys.message] || DWZ.msg("sessionTimout"), {
                    okCall: function() {
                        DWZ.loadLogin();
                    }
                });
            } else {
                $.bringBackSuggest(json);
                $.pdialog.closeCurrent();
            }
        },
        batchBringBack: function(args) {
            if(_lookup.nextButton ) {
                for ( var row in args) {
                    _lookup.nextButton.click();
                    if (args[row][DWZ.keys.statusCode] == DWZ.statusCode.error ) {
                        if (args[row][DWZ.keys.message] ) {
                            alertMsg.error(args[row][DWZ.keys.message]);
                        }
                        break;
                    } else if (args[row][DWZ.keys.statusCode] == DWZ.statusCode.timeout ) {
                        alertMsg.error(args[row][DWZ.keys.message] || DWZ.msg("sessionTimout"), {
                            okCall: function() {
                                DWZ.loadLogin();
                            }
                        });
                        break;
                    } else {
                        $.bringBackSuggest(args[row]);
                    }
                }
            }
            $.pdialog.closeCurrent();
        }
    });
    $.fn.extend({
        lookup: function() {
            return this.each(function() {
                var $this = $(this), options = {
                    mask: true, width: $this.attr('width') || 820, height: $this.attr('height') || 500, maxable: eval($this.attr("maxable") || "true") ,
                    resizable: eval($this.attr("resizable") || "true")
                };
                $this.click(function(event) {
                    _lookup = $.extend(_lookup, {
                        currentGroup: $this.attr("lookupGroup") || "", suffix: $this.attr("suffix") || "", $target: $this, pk: $this.attr("lookupPk") || ""
                    });
                    var url = $this.attr("href").replaceTmById($(event.target).parents(".unitBox:first"));
                    if (!url.isFinishedTm() ) {
                        alertMsg.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
                        return false;
                    }
                    $.pdialog.open(url, "_blank", $this.attr("title") || $this.text(), options);
                    return false;
                });
            });
        } ,
        multLookup: function() {
            return this.each(function() {
                var $this = $(this), args = {};
                $this.click(function(event) {
                    var $unitBox = $this.parents(".unitBox:first");
                    $unitBox.find("[name='" + $this.attr("multLookup") + "']").filter(":checked").each(function() {
                        var _args = DWZ.jsonEval($(this).val());
                        for ( var key in _args) {
                            var value = args[key] ? args[key] + ",": "";
                            args[key] = value + _args[key];
                        }
                    });
                    if ($.isEmptyObject(args) ) {
                        alertMsg.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
                        return false;
                    }
                    $.bringBack(args);
                    return false;
                });
            });
        } ,
        suggest: function() {
            var op = {
                suggest$: "#suggest", suggestShadow$: "#suggestShadow"
            };
            var selectedIndex = -1;
            return this.each(function() {
                var $input = $(this).attr('autocomplete', 'off').keydown(function(event) {
                    if (event.keyCode == DWZ.keyCode.ENTER && $(op.suggest$).is(':visible') ) {
                        return false; // 屏蔽回车提交
                    }
                });
                var suggestFields = $input.attr('suggestFields').split(",");
                function _show(event) {
                    var offset = $input.offset();
                    var iTop = offset.top + this.offsetHeight;
                    var $suggest = $(op.suggest$);
                    if ($suggest.size() == 0 ) {
                        $suggest = $('<div id="suggest"></div>').appendTo($('body'));
                    }
                    $suggest.css({
                        left: offset.left + 'px', top: iTop + 'px'
                    }).show();
                    _lookup = $.extend(_lookup, {
                        currentGroup: $input.attr("lookupGroup") || "", suffix: $input.attr("suffix") || "", $target: $input, pk: $input.attr("lookupPk") || ""
                    });
                    var url = $input.attr("suggestUrl").replaceTmById($(event.target).parents(".unitBox:first"));
                    if (!url.isFinishedTm() ) {
                        alertMsg.error($input.attr("warn") || DWZ.msg("alertSelectMsg"));
                        return false;
                    }
                    var postData = {};
                    postData[$input.attr("postField") || "inputValue"] = $input.val();
                    $.ajax({
                        global: false, type: 'POST', dataType: "json", url: url, cache: false, data: postData, success: function(response) {
                            if (!response ) {
                                return;
                            }
                            var html = '';
                            $.each(response, function(i) {
                                var liAttr = '', liLabel = '';
                                for (var i = 0; i < suggestFields.length; i++) {
                                    var str = this[suggestFields[i]];
                                    if (str ) {
                                        if (liLabel ) {
                                            liLabel += '-';
                                        }
                                        liLabel += str;
                                    }
                                }
                                for ( var key in this) {
                                    if (liAttr ) {
                                        liAttr += ',';
                                    }
                                    liAttr += key + ":'" + this[key] + "'";
                                }
                                html += '<li lookupAttrs="' + liAttr + '">' + liLabel + '</li>';
                            });
                            var $lis = $suggest.html('<ul>' + html + '</ul>').find("li");
                            $lis.click(function() {
                                _select($(this));
                                if($input.next().hasClass('suggestButton')){
                                    $input.next().click();
                                }
                            });
                            if ($lis.size() == 0 ) {
                                var jsonStr = "";
                                for (var i = 0; i < suggestFields.length; i++) {
                                    if (_util.lookupField(suggestFields[i]) == event.target.name ) {
                                        break;
                                    }
                                    if (jsonStr ) {
                                        jsonStr += ',';
                                    }
                                    jsonStr += suggestFields[i] + ":''";
                                }
                                jsonStr = "{" + _lookup.pk + ":''," + jsonStr + "}";
                                $.bringBackSuggest(DWZ.jsonEval(jsonStr));
                            }
                        }, error: function() {
                            $suggest.html('');
                        }
                    });
                    $(document).bind("click", _close);
                    return false;
                }
                function _select($item) {
                    var jsonStr = "{" + $item.attr('lookupAttrs') + "}";
                    $.bringBackSuggest(DWZ.jsonEval(jsonStr));
                }
                function _close() {
                    $(op.suggest$).html('').hide();
                    selectedIndex = -1;
                    $(document).unbind("click", _close);
                }
                $input.focus(_show).click(false).keyup(function(event) {
                    var $items = $(op.suggest$).find("li");
                    switch (event.keyCode) {
                        case DWZ.keyCode.ESC:
                        case DWZ.keyCode.TAB:
                        case DWZ.keyCode.SHIFT:
                        case DWZ.keyCode.HOME:
                        case DWZ.keyCode.END:
                        case DWZ.keyCode.LEFT:
                        case DWZ.keyCode.RIGHT:
                            break;
                        case DWZ.keyCode.ENTER:
                            _close();
                            break;
                        case DWZ.keyCode.DOWN:
                            if (selectedIndex >= $items.size() - 1 ) {
                                selectedIndex = -1;
                            } else {
                                selectedIndex++;
                            }
                            break;
                        case DWZ.keyCode.UP:
                            if (selectedIndex < 0 ) {
                                selectedIndex = $items.size() - 1;
                            } else {
                                selectedIndex--;
                            }
                            break;
                        default :
                            _show(event);
                    }
                    $items.removeClass("selected");
                    if (selectedIndex >= 0 ) {
                        var $item = $items.eq(selectedIndex).addClass("selected");
                        _select($item);
                    }
                });
            });
        } ,
        itemDetail: function() {
            return this.each(function() {
                var $table = $(this).css("clear", "both"), $tbody = $table.find("tbody");
                var fields = [ ];
                $table.find("tr:first th[type]").each(function(i) {
                    var $th = $(this);
                    var field = {
                        type: $th.attr("type") || "text", patternDate: $th.attr("dateFmt") || "yyyy-MM-dd", name: $th.attr("name") || "" ,
                        defaultVal: $th.attr("defaultVal") || "", size: $th.attr("size") || "12", enumUrl: $th.attr("enumUrl") || "" ,
                        lookupGroup: $th.attr("lookupGroup") || "", lookupUrl: $th.attr("lookupUrl") || "", lookupPk: $th.attr("lookupPk") || "id" ,
                        suggestUrl: $th.attr("suggestUrl"), suggestFields: $th.attr("suggestFields"), postField: $th.attr("postField") || "" ,
                        fieldClass: $th.attr("fieldClass") || "", fieldAttrs: $th.attr("fieldAttrs") || "", title:$th.text()
                    };
                    fields.push(field);
                });
                $tbody.find("a.btnDel").click(function() {
                    var $btnDel = $(this);
                    if ($btnDel.is("[href^=javascript:]") ) {
                        $btnDel.parents("tr:first").remove();
                        initSuffix($tbody);
                        return false;
                    }
                    function delDbData() {
                        $.ajax({
                            type: 'POST', dataType: "json", url: $btnDel.attr('href'), cache: false, success: function() {
                                $btnDel.parents("tr:first").remove();
                                initSuffix($tbody);
                            }, error: DWZ.ajaxError
                        });
                    }
                    if ($btnDel.attr("title") ) {
                        alertMsg.confirm($btnDel.attr("title"), {
                            okCall: delDbData
                        });
                    } else {
                        delDbData();
                    }
                    return false;
                });
                var addButTxt = $table.attr('addButton') || "Add New";
                if (addButTxt ) {
                    var $addBut = $('<label style="width:auto;"><button type="button" class="button">' + addButTxt + '</button></label>').insertBefore($table).find('button');
                    var batchButtonTxt = $table.attr('batchButton') || "Batch upload";
                    var batchUploadUrl = $table.attr('batchUploadUrl');
                    if(batchUploadUrl){
                        var $batchButton = $('<label><a class="button" lookupGroup="" href="'+batchUploadUrl+'" width="1000" height="600" >'+batchButtonTxt+'</a></label>').initUI().insertBefore($table).find('a');
                        $batchButton.click(function(){
                            _lookup = $.extend(_lookup, {
                                nextButton : $addBut
                            });
                        });
                    } else {
                        var $rowNum = $('<label><input type="text" name="dwz_rowNum" class="textInput" value="1" size="2"/></label>').insertBefore($table).find('input');
                    }

                    var trTm = "";
                    $addBut.click(function() {
                        if (!trTm ) {
                            trTm = trHtml(fields);
                        }
                        var rowNum = 1;
                        if(!batchUploadUrl ){
                            try {
                                rowNum = parseInt($rowNum.val());
                            } catch (e) {}
                        }
                        for (var i = 0; i < rowNum; i++) {
                            var $tr = $($.parseHTML(trTm, document, true));
                            $tr.appendTo($tbody).initUI().find("a.btnDel").click(function() {
                                $(this).parents("tr:first").remove();
                                initSuffix($tbody);
                                return false;
                            });
                        }
                        initSuffix($tbody);
                        var $attach = $tr.find('.btnAttach');
                        if(batchUploadUrl && $attach ){
                            _lookup = $.extend(_lookup, {
                                currentGroup: $attach.attr("lookupGroup") || "", suffix: $attach.attr("suffix") || "", $target: $attach, pk: $attach.attr("lookupPk") || ""
                            });
                        }
                    });
                }
            });

            /**
             * 删除时重新初始化下标
             */
            function initSuffix($tbody) {
                $tbody.find('>tr').each(function(i) {
                    $(':input, a.btnLook, a.btnAttach', this).each(function() {
                        var $this = $(this), name = $this.attr('name'), val = $this.val();
                        if (name ) {
                            $this.attr('name', name.replaceSuffix(i));
                        }
                        var lookupGroup = $this.attr('lookupGroup');
                        if (lookupGroup ) {
                            $this.attr('lookupGroup', lookupGroup.replaceSuffix(i));
                        }
                        var suffix = $this.attr("suffix");
                        if (suffix ) {
                            $this.attr('suffix', suffix.replaceSuffix(i));
                        }
                        if (val && val.indexOf("#index#") >= 0 ) {
                            $this.val(val.replace('#index#', i + 1));
                        }
                    });
                });
            }
            function tdHtml(field) {
                var html = '', suffix = '';
                if (field.name.endsWith("[#index#]") ) {
                    suffix = "[#index#]";
                } else if (field.name.endsWith("[]") ) {
                    suffix = "[]";
                }
                var suffixFrag = suffix ? ' suffix="' + suffix + '" ': '';
                var attrFrag = '';
                if (field.fieldAttrs ) {
                    var attrs = DWZ.jsonEval(field.fieldAttrs);
                    for ( var key in attrs) {
                        attrFrag += key + '="' + attrs[key] + '"';
                    }
                }
                switch (field.type) {
                    case 'del':
                        html = '<a href="javascript:void(0)" class="btnDel ' + field.fieldClass + '"></a>';
                        break;
                    case 'lookup':
                        var suggestFrag = '';
                        if (field.suggestFields ) {
                            suggestFrag = 'autocomplete="off" lookupGroup="' + field.lookupGroup + '"' + suffixFrag + ' suggestUrl="' + field.suggestUrl + '" suggestFields="'
                                    + field.suggestFields + '"' + ' postField="' + field.postField + '"';
                        }
                        html = '<input type="hidden" name="' + field.lookupGroup + '.' + field.lookupPk + suffix + '"/>' + '<input type="text" name="' + field.name + '"'
                                + suggestFrag + ' lookupPk="' + field.lookupPk + '" size="' + field.size + '" class="' + field.fieldClass + '" ' + attrFrag + '/>' + '<a class="btnLook" href="'
                                + field.lookupUrl + '" lookupGroup="' + field.lookupGroup + '" ' + suggestFrag + ' lookupPk="' + field.lookupPk + '" ' + attrFrag + '>'+field.title+'</a>';
                        break;
                    case 'attach':
                        html = '<input type="hidden" name="' + field.lookupGroup + '.' + field.lookupPk + suffix + '"/>' + '<input type="text" name="' + field.name + '" size="'
                                + field.size + '" class="' + field.fieldClass + '" ' + attrFrag + '/>' + '<a class="btnAttach" href="' + field.lookupUrl + '" lookupGroup="' + field.lookupGroup
                                + '" ' + suffixFrag + ' lookupPk="' + field.lookupPk + '" width="1000" height="600" ' + attrFrag + '>'+field.title+'</a>';
                        break;
                    case 'enum':
                        $.ajax({
                            type: "POST", dataType: "html", async: false, url: field.enumUrl, data: {
                                inputName: field.name
                            }, success: function(response) {
                                html = response;
                            }
                        });
                        break;
                    case 'date':
                        html = '<input type="text" name="' + field.name + '" value="' + field.defaultVal + '" class="date ' + field.fieldClass + '" dateFmt="' + field.patternDate
                                + '" size="' + field.size + '" ' + attrFrag + '/>';
                        break;
                    case 'checkbox':
                        html = '<input type="checkbox" name="' + field.name + '" class="' + field.fieldClass + '" ' + attrFrag + '/>';
                        break;
                    case 'textarea':
                        html = '<textarea name="' + field.name + '" class="' + field.fieldClass + '" ' + attrFrag + '>' + field.defaultVal + '</textarea>';
                        break;
                    case 'number':
                        html = '<input type="number" name="' + field.name + '" value="' + field.defaultVal + '" size="' + field.size + '" class="' + field.fieldClass + '" '
                        + attrFrag + '/>';
                        break;
                    default :
                        html = '<input type="text" name="' + field.name + '" value="' + field.defaultVal + '" size="' + field.size + '" class="' + field.fieldClass + '" '
                                + attrFrag + '/>';
                        break;
                }
                return '<td>' + html + '</td>';
            }
            function trHtml(fields) {
                var html = '';
                $(fields).each(function() {
                    html += tdHtml(this);
                });
                return '<tr class="unitBox">' + html + '</tr>';
            }
        },
        selectedTodo: function() {
            function _getIds(selectedIds, targetType) {
                var ids = "";
                var $box = targetType == "dialog" ? $.pdialog.getCurrent(): navTab.getCurrentPanel();
                $box.find("input:checked").filter("[name='" + selectedIds + "']").each(function(i) {
                    var val = $(this).val();
                    ids += i == 0 ? val: "," + val;
                });
                return ids;
            }
            return this.each(function() {
                var $this = $(this);
                var selectedIds = $this.attr("rel") || "ids";
                var postType = $this.attr("postType") || "map";
                $this.click(function() {
                    var targetType = $this.attr("targetType");
                    var ids = _getIds(selectedIds, targetType);
                    if (!ids ) {
                        alertMsg.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
                        return false;
                    }
                    var _callback = $this.attr("callback") || ( targetType == "dialog" ? dialogAjaxDone: navTabAjaxDone );
                    if (!$.isFunction(_callback) ) {
                        _callback = eval('(' + _callback + ')');
                    }
                    function _doPost() {
                        $.ajax({
                            type: 'POST', url: $this.attr('href'), dataType: 'json', cache: false, data: function() {
                                if (postType == 'map' ) {
                                    return $.map(ids.split(','), function(val, i) {
                                        return {
                                            name: selectedIds, value: val
                                        };
                                    })
                                } else {
                                    var _data = {};
                                    _data[selectedIds] = ids;
                                    return _data;
                                }
                            }(), success: _callback, error: DWZ.ajaxError
                        });
                    }
                    var title = $this.attr("title");
                    if (title ) {
                        alertMsg.confirm(title, {
                            okCall: _doPost
                        });
                    } else {
                        _doPost();
                    }
                    return false;
                });
            });
        }
    });
} )(jQuery);

/**
 * @author Roger Wu
 */
( function($) {
    $.extend($.fn, {
        jBlindUp: function(options) {
            var op = $.extend({
                duration: 500, easing: "swing", call: function() {
                }
            }, options);
            return this.each(function() {
                var $this = $(this);
                $(this).animate({
                    height: 0
                }, {
                    step: function() {
                    }, duration: op.duration, easing: op.easing, complete: function() {
                        $this.css({
                            display: "none"
                        });
                        op.call();
                    }
                });
            });
        },
        jBlindDown: function(options) {
            var op = $.extend({
                to: 0, duration: 500, easing: "swing", call: function() {
                }
            }, options);
            return this.each(function() {
                var $this = $(this);
                var fixedPanelHeight = ( op.to > 0 ) ? op.to: $.effect.getDimensions($this[0]).height;
                $this.animate({
                    height: fixedPanelHeight
                }, {
                    step: function() {
                    }, duration: op.duration, easing: op.easing, complete: function() {
                        $this.css({
                            display: ""
                        });
                        op.call();
                    }
                });
            });
        },
        jSlideUp: function(options) {
            var op = $.extend({
                to: 0, duration: 500, easing: "swing", call: function() {
                }
            }, options);
            return this.each(function() {
                var $this = $(this);
                $this.wrapInner("<div></div>");
                var fixedHeight = ( op.to > 0 ) ? op.to: $.effect.getDimensions($(">div", $this)[0]).height;
                $this.css({
                    overflow: "visible", position: "relative"
                });
                $(">div", $this).css({
                    position: "relative"
                }).animate({
                    top: -fixedHeight
                }, {
                    easing: op.easing, duration: op.duration, complete: function() {
                        $this.html($(this).html());
                    }
                });
            });
        },
        jSlideDown: function(options) {
            var op = $.extend({
                to: 0, duration: 500, easing: "swing", call: function() {
                }
            }, options);
            return this.each(function() {
                var $this = $(this);
                var fixedHeight = ( op.to > 0 ) ? op.to: $.effect.getDimensions($this[0]).height;
                $this.wrapInner("<div style=\"top:-" + fixedHeight + "px;\"></div>");
                $this.css({
                    overflow: "visible", position: "relative", height: "0px"
                }).animate({
                    height: fixedHeight
                }, {
                    duration: op.duration, easing: op.easing, complete: function() {
                        $this.css({
                            display: "", overflow: ""
                        });
                        op.call();
                    }
                });
                $(">div", $this).css({
                    position: "relative"
                }).animate({
                    top: 0
                }, {
                    easing: op.easing, duration: op.duration, complete: function() {
                        $this.html($(this).html());
                    }
                });
            });
        }
    });
    $.effect = {
        getDimensions: function(element, displayElement) {
            var dimensions = new $.effect.Rectangle;
            var displayOrig = $(element).css("display");
            var visibilityOrig = $(element).css("visibility");
            var isZero = $(element).height() == 0 ? true: false;
            if ($(element).is(":hidden") ) {
                $(element).css({
                    visibility: "hidden", display: "block"
                });
                if (isZero ) {
                    $(element).css("height", "");
                }
                if ($.browser.opera ) {
                    refElement.focus();
                }
            }
            dimensions.height = $(element).outerHeight();
            dimensions.width = $(element).outerWidth();
            if (displayOrig == 'none' ) {
                $(element).css({
                    visibility: visibilityOrig, display: 'none'
                });
                if (isZero ) {
                    $(element).css("height", "0px");
                }
            }
            return dimensions;
        }
    }
    $.effect.Rectangle = function() {
        this.width = 0;
        this.height = 0;
        this.unit = "px";
    }
} )(jQuery);
/**
 * @author ZhangHuihua@msn.com
 */
( function($) {
    $.fn.extend({
        checkboxCtrl: function(parent) {
            return this.each(function() {
                var $trigger = $(this);
                $trigger.click(function() {
                    var group = $trigger.attr("group");
                    if ($trigger.is(":checkbox") ) {
                        var type = $trigger.is(":checked") ? "all": "none";
                        if (group ) {
                            $.checkbox.select(group, type, parent);
                        }
                    } else {
                        if (group ) {
                            $.checkbox.select(group, $trigger.attr("selectType") || "all", parent);
                        }
                    }
                });
            });
        }
    });
    $.checkbox = {
        selectAll: function(_name, _parent) {
            this.select(_name, "all", _parent);
        },
        unSelectAll: function(_name, _parent) {
            this.select(_name, "none", _parent);
        },
        selectInvert: function(_name, _parent) {
            this.select(_name, "invert", _parent);
        },
        select: function(_name, _type, _parent) {
            $parent = $(_parent || document);
            $checkboxLi = $parent.find(":checkbox[name='" + _name + "']");
            switch (_type) {
                case "invert":
                    $checkboxLi.each(function() {
                        $checkbox = $(this);
                        $checkbox.prop('checked', !$checkbox.is(":checked"));
                    });
                    break;
                case "none":
                    $checkboxLi.prop('checked', false);
                    break;
                default :
                    $checkboxLi.prop('checked', true);
                    break;
            }
        }
    };
} )(jQuery);
/**
 * @author Roger Wu
 */

( function($) {
    var allSelectBox = [ ];
    var killAllBox = function(bid) {
        $.each(allSelectBox, function(i) {
            if (allSelectBox[i] != bid ) {
                if (!$("#" + allSelectBox[i])[0] ) {
                    $("#op_" + allSelectBox[i]).remove();
                } else {
                    $("#op_" + allSelectBox[i]).css({
                        height: "", width: ""
                    }).hide();
                }
                $('#'+ allSelectBox[i]).children('a').removeClass('expand');
                $(document).unbind("click", killAllBox);
            }
        });
    };
    var _onchange = function(event) {
        var $ref = $("select[name=" + escapeJquery(event.data.$this.attr('ref'))+"]");
        if ($ref.size() == 0 ) {
            return false;
        }
        if(event.data.$this.attr('index')){
            $ref=$ref.eq(event.data.$this.attr('index'));
        }
        $.ajax({
            type: 'POST', dataType: "json", url: event.data.$this.attr('refUrl').replace("{value}", encodeURIComponent(event.data.$this.val())), cache: false, data: {} ,
            success: function(json) {
                if (!json ) {
                    return;
                }
                var html = '';
                $.each(json, function(i) {
                    if (json[i] && json[i].length > 1 ) {
                        html += '<option value="' + json[i][0] + '">' + json[i][1] + '</option>';
                    }
                });
                var $refCombox = $ref.parents("div.combox:first");
                $ref.html(html).insertAfter($refCombox);
                $refCombox.remove();
                $ref.trigger("change").combox();
            }, error: DWZ.ajaxError
        });
    };
    $.extend($.fn, {
        comboxSelect: function(options) {
            var op = $.extend({
                selector: ">a"
            }, options);
            return this.each(function() {
                var box = $(this);
                var selector = $(op.selector, box);
                allSelectBox.push(box.attr("id"));
                $(op.selector, box).click(function() {
                    var options = $("#op_" + box.attr("id"));
                    var optionlist=$('ul',options);
                    if (options.is(":hidden") ) {
                        box.children('a').addClass('expand');
                        if (options.height() > 300 ) {
                            optionlist.css({
                                height: "300px", overflow: "scroll"
                            });
                        }
                        var top = box.offset().top + box[0].offsetHeight + 1;
                        if (top + options.outerHeight(true) > $(window).height() - 20 ) {
                            top = top - box.outerHeight(true) - options.outerHeight(true) - 1;
                        }
                        options.css({
                            top: top, left: box.offset().left
                        }).show();
                        if($('a.selected',options).length){
                            optionlist.stop().animate({scrollTop:$('a.selected',optionlist).offset().top-optionlist.offset().top+optionlist.scrollTop()},500);
                        }
                        $('.search input',options).focus().keyup(function(){
                            var val = $(this).val();
                            if(val){
                                $('li',optionlist).hide();
                                $('li a:contains('+escapeJquery(val)+')',optionlist).parent().show();
                                $('li a',optionlist).each(function(){
                                    if(0 < $(this).attr('value').indexOf(val)){
                                        $(this).parent().show();
                                    }
                                });
                            }else{
                                $('li',optionlist).show();
                            }
                            $('li.disabled',optionlist).hide();
                        }).click(function(){
                            return false;
                        }).val('');
                        $('li',optionlist).show();
                        $('li.disabled',optionlist).hide();
                        killAllBox(box.attr("id"));
                        $(document).click(killAllBox);
                    } else {
                        $(document).unbind("click", killAllBox);
                        killAllBox();
                    }
                    return false;
                });
                $("#op_" + box.attr("id")).find(" li").comboxOption(selector, box);
            });
        } ,
        comboxOption: function(selector, box) {
            return this.each(function() {
                $(">a", this).click(function() {
                    var $this = $(this);
                    $this.parent().parent().find(".selected").removeClass("selected");
                    $this.addClass("selected");
                    selector.text($this.text());
                    var $input = $("select", box);
                    if ($input.val() != $this.attr("value") ) {
                        $("select", box).val($this.attr("value")).trigger("change");
                    }
                });
            });
        } ,
        combox: function() {
            /* 清理下拉层 */
            var _selectBox = [ ];
            $.each(allSelectBox, function(i) {
                if ($("#" + allSelectBox[i])[0] ) {
                    _selectBox.push(allSelectBox[i]);
                } else {
                    $("#op_" + allSelectBox[i]).remove();
                }
            });
            allSelectBox = _selectBox;
            return this.each(function(i) {
                var $this = $(this).removeClass("combox");
                var name = $this.attr("name");
                var value = $this.val();
                var label = '';
                if( "undefined" !== typeof value  && value){
                    label = $("option[value=" + escapeJquery(value) + "]", $this).text();
                }else if("" == value){
                    label = $("option[value='']", $this).text();
                }
                var ref = $this.attr("ref");
                var refUrl = $this.attr("refUrl") || "";
                var cid = $this.attr("id") || Math.round(Math.random() * 10000000);
                var select = '<div class="combox"><div id="combox_' + cid + '" class="select"' + ( ref ? ' ref="' + ref + '"': '' ) + '>';
                select += '<a href="javascript:" class="' + $this.attr("class") + '" name="' + name + '" value="' + value + '">' + label + '</a></div></div>';
                var options = '<div class="comboxop" id="op_combox_' + cid + '"><div class="search"><input type="text" class="textInput"/></div><ul>';
                $("option", $this).each(function() {
                    var option = $(this);
                    options += "<li><a class=\"" + ( value == option[0].value ? "selected": "" ) + "\" href=\"#\" value=\"" + option[0].value + "\">" + option[0].text
                            + "</a></li>";
                });
                options += "</ul></div>";
                $("body").append(options);
                $this.after(select);
                $("div.select", $this.next()).comboxSelect().append($this);
                if (ref && refUrl ) {
                    $this.unbind("change", _onchange).bind("change", {
                        $this: $this
                    }, _onchange);
                }
            });
        }
    });
} )(jQuery);
/**
 * jQuery ajax history plugins
 * @author 张慧华 z@j-ui.com
 */


(function($){

    $.extend({

        History: {
            _hash: new Array(),
            _currentHash: "",
            _callback: undefined,
            init: function(callback){
                $.History._callback = callback;
                var current_hash = location.hash.replace(/\?.*$/, '');
                $.History._currentHash = current_hash;

                if (!$.support.leadingWhitespace) {
                    if ($.History._currentHash == '') {
                        $.History._currentHash = '#';
                    }
                    $("body").append('<iframe id="jQuery_history" style="display: none;" src="about:blank"></iframe>');
                    var ihistory = $("#jQuery_history")[0];
                    var iframe = ihistory.contentDocument || ihistory.contentWindow.document;
                    iframe.open();
                    iframe.close();
                    iframe.location.hash = current_hash;
                }
                if ($.isFunction(this._callback))
                    $.History._callback(current_hash.skipChar("#"));
                setInterval($.History._historyCheck, 100);
            },
            _historyCheck: function(){
                var current_hash = "";
                if (!$.support.leadingWhitespace) {
                    var ihistory = $("#jQuery_history")[0];
                    var iframe = ihistory.contentWindow;
                    current_hash = iframe.location.hash.skipChar("#").replace(/\?.*$/, '');
                } else {
                    current_hash = location.hash.skipChar('#').replace(/\?.*$/, '');
                }
                if (current_hash != $.History._currentHash) {
                    $.History._currentHash = current_hash;
                    $.History.loadHistory(current_hash);
                }

            },
            addHistory: function(hash, fun, args){
                $.History._currentHash = hash;
                var history = [hash, fun, args];
                $.History._hash.push(history);
                if (!$.support.leadingWhitespace) {
                    var ihistory = $("#jQuery_history")[0];
                    var iframe = ihistory.contentDocument || ihistory.contentWindow.document;
                    iframe.open();
                    iframe.close();
                    iframe.location.hash = hash.replace(/\?.*$/, '');
                    location.hash = hash.replace(/\?.*$/, '');
                } else {
                    location.hash = hash.replace(/\?.*$/, '');
                }
            },
            loadHistory: function(hash){
                if (!$.support.leadingWhitespace) {
                    location.hash = hash;
                }
                for (var i = 0; i < $.History._hash.length; i += 1) {
                    if ($.History._hash[i][0] == hash) {
                        $.History._hash[i][1]($.History._hash[i][2]);
                        return;
                    }
                }
            }
        }
    });
})(jQuery);
/**
 * @author ZhangHuihua@msn.com
 */
( function($) {
    $.printBox = function(rel) {
        var _printBoxId = 'printBox';
        var $contentBox = rel ? $('#' + rel): $("body"), $printBox = $('#' + _printBoxId);
        if ($printBox.size() == 0 ) {
            $printBox = $('<div id="' + _printBoxId + '"></div>').appendTo("body");
        }
        $printBox.html($contentBox.html()).find("[layoutH]").height("auto");
        window.print();
    }
} )(jQuery);