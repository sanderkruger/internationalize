
(function($) {

$.fn.internationalize = function() {

    if (!this.length) return this;
    var options = null;
    if (typeof arguments[0] === 'object') {
        options = arguments[0];
    } else {
        options = {};
        if (arguments.length > 0) {
            options['language'] = arguments[0];
        }
        if (arguments.lenght > 1) {
            options['onLoad'] = arguments[1];
        }
    }

    var l = $(this).data('lang');
    if (l) {
        l.updateOptions(options);
    } else {
        $(this).data('lang', new Lang(this, options));
    }
    return this;
};

function Lang(element, options) {
    var self = this;
    this.$el = element;
    this.options = $.extend({}, Lang.Defaults, options);
    this.categories = {};
    this.cache = {};
    this._initialized = false;
    this.langName = null;
    this.currentLang = null;
    // Load default language and target language
    this.loadLanguage(this.options.defaultLang);
    if (self.options.hasOwnProperty('language') &&
        this.options.language !== this.options.defaultLang) {
        this.loadLanguage(this.options.language);
    }
    $(document).ready(function() {
        self.initTags();
        // On init, check if the target language is still the same and if it needs
        // loading or applying
        if (self.options.hasOwnProperty('language')) {
            self.loadLanguage(self.options.language);
        }
    });
}

Lang.Defaults = {
    attrs: ['placeholder', 'title', 'alt', 'data-content'],
    langPath: 'lang',
    defaultLang: 'en',
    shortcuts: true
};

Lang.prototype.updateOptions = function(options) {
    var loadLang = false;
    var loadDefault = false;
    for (var key in options) {
        if (!this.options.hasOwnProperty(key) || this.options[key] !== options[key]) {
            this.options[key] = options[key];
            switch (key) {
                case 'langPath':
                    // Update lang
                    loadLang = true;
                    loadDefault = true;
                    break;
                case 'language':
                    // Update lang
                    loadLang = true;
                    break;
                case 'defaultLang':
                    // Update lang
                    loadDefault = true;
                    break;
            }
        }
    }
    if (loadDefault) {
        this.loadLanguage(this.options.defaultLang);
    }
    if (loadLang) {
        this.loadLanguage(this.options.language);
    }
};

Lang.prototype.name = function() {
    return this.langName;
};

Lang.prototype.get = function(tag) {
    return this._get.apply(this, arguments) || this._default.apply(this, arguments);
}

Lang.prototype._get = function(tag) {
    var tags = tag.split('.');
    if (!this.categories[tags[0]]) {
        return null;
    }
    var l = this[tags[0]];
    for (var i = 1; i < tags.length; i++) {
        var t = tags[i];
        if (!l.hasOwnProperty(t)) {
            return null;
        }
        l = l[t];
    }
    if (typeof l === 'string') {
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                l = l.replace('{'+(i-1)+'}', arguments[i]);
            }
        }
        return l;
    }
    return null;
};

Lang.prototype._default = function(tag) {
    var tags = tag.split('.');
    if (!this.options.hasOwnProperty('defaultLang') || !this.cache.hasOwnProperty(this.options.defaultLang)) {
        return null;
    }
    var lang = this.cache[this.options.defaultLang];
    var l = lang[tags[0]];
    for (var i = 1; i < tags.length; i++) {
        var t = tags[i];
        l = l[t];
    }
    if (typeof l === 'string') {
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                l = l.replace('{'+(i-1)+'}', arguments[i]);
            }
        }
        return l;
    }
};

Lang.prototype.initTags = function() {
    // Select all nodes with only text.
    var data = this.$el.data('internationalize');
    if (data !== undefined) {
        return;
    }
    this.$el.data('internationalize', {init: 'true'});
    $(":parent:not(:has(*))", this.$el).each(function(i,e) {
        var text = $.trim(e.innerHTML);
        if (text === "") return;
        var tag = null;
        if (text.substr(0, 3) === "{{{") {
            // HTML placeholder
            tag = "&"+text.substr(3, text.length - 6);
        } else if (text.substr(0, 2) === "{{") {
            // Text placeholder
            tag = text.substr(2, text.length - 4);
        }
        if (tag !== null) {
            var tagPartsPos = tag.indexOf(",");
            if (tagPartsPos !== -1) {
                // This tag has variables. Add an attribute to hold the variable names
                var vars = $.trim(tag.substr(tagPartsPos+1));
                tag = $.trim(tag.substr(0, tagPartsPos));
                if (vars !== "") {
                    $(e).attr('lang-vars', vars);
                }
            }
            $(e).html("&nbsp;").attr('lang-text', tag);
        }
    });
    // Select all elements with a placeholder, title or alt
    var self = this;
    var selector = "", sep = "";
    for (var i in this.options.attrs) {
        selector+= sep+"["+this.options.attrs[i]+"]";
        sep = ",";
    }
    $(selector, this.$el).each(function(i,e) {
        for (var i in self.options.attrs) {
            self.setTag(e, self.options.attrs[i]);
        }
    });
    self._initialized = true;
    self.trigger('initialized');
};

Lang.prototype.setTag = function(e, attr) {
    var text = $.trim($(e).attr(attr));
    if (text !== "" && text.substr(0, 2) === "{{") {
        var tag = text.substr(2, text.length - 4);
        if (tag !== null) {
            var tagPartsPos = tag.indexOf(",");
            if (tagPartsPos !== -1) {
                // This tag has variables. Add an attribute to hold the variable names
                var vars = $.trim(tag.substr(tagPartsPos+1));
                tag = $.trim(tag.substr(0, tagPartsPos));
                if (vars !== "") {
                    $(e).attr('lang-vars', vars);
                }
            }
            $(e).attr('lang-'+attr, tag).attr(attr, "");
        }
    }
};

// Load language into cache, without updating the DOM
Lang.prototype.loadLanguage = function(language) {
    if (this.cache.hasOwnProperty(language) && typeof this.cache[language] === 'object') {
        this.trigger('load', {language:'language'});
        if (language === this.options.language &&
            this.currentLang !== this.options.language &&
            this._initialized) {
            // The target language is loaded but not initialized
            this.applyLanguage();
        }
        return;
    }
    if (this.cache.hasOwnProperty(language)) {
        // This language is being loaded. Just do nothing and wait.
        return;
    }
    this.cache[language] = true;
    var langParts = language.split('-');
    var langFile = this.options.langPath+'/'+langParts[0]+'.json';
    var self = this;
    $.getJSON(langFile)
        .done(function(json) {
            self.cache[language] = json;
            self.trigger('load', {language:'language'});
            if (language === self.options.language &&
                self.currentLang !== self.options.language &&
                self._initialized) {
                self.applyLanguage();
            }
        })
        .fail(function() {
            delete self.cache[language];
            self.trigger('load', {language:'language'});
        });
};

// Set language as the current language.
Lang.prototype.setLanguage = function(language) {
    this.options.language = language;
    this.loadLanguage(language);
};

Lang.prototype.applyLanguage = function() {
    var self = this;
    var lang = this.cache[this.options.language];
    if (this.options.hasOwnProperty('defaultLang') && this.cache.hasOwnProperty(this.options.defaultLang)) {
        lang = $.extend(true, {}, this.cache[this.options.defaultLang], lang);
    }
    if (this.options.shortcuts) {
        // Create shortcuts on the Lang object
        for (var i in self.categories) {
            if (self.categories[i]) {
                delete self[i];
                self.categories[i] = false;
            }
        }
        for (var i in lang) {
            if (i === "name") {
                // Name of the language
                self.langName = lang[i];
            } else if (!self.hasOwnProperty(i)) {
                self.categories[i] = true;
                self[i] = lang[i];
            }
        }
    }
    this.updateLanguage();
    this.currentLang = self.options.language;
};

// Replace DOM strings with internationalized versions.
Lang.prototype.updateLanguage = function() {
    var self = this;
    // First substitute text nodes
    $("[lang-text]", self.$el).each(function(i,e) {
        var tag = $(e).attr('lang-text');
        var html = false;
        // Tags that are placed with {{{ (triple) are marked with &. They expect
        // HTML markup from the language file.
        if (tag.substr(0, 1) === '&') {
            html = true;
            tag = tag.substr(1);
        }
        // Strip first part (lang.).
        tag = tag.substr(tag.indexOf('.')+1);
        var text = self.get(tag);
        if (typeof(text) === 'string') {
            // The language string is found. Now check if the tag has vars to substitute.
            var vars = $(e).attr('lang-vars');
            if (vars !== undefined) {
                // There are vars, this means markup must be inserted. If the text
                // is non-HTML, transform it here.
                if (!html) {
                    text = $('<div/>').text(text).html();
                    html = true;
                }
                // Split the vars up. Then find placeholders {n} until they run out
                var v = vars.split(',');
                var p = 0;
                while (true) {
                    // No more vars? exit
                    if (v.length <= p) break;
                    var pp = '{'+p+'}';
                    var pPos = text.indexOf(pp);
                    // No more placeholders? exit
                    if (pPos === -1) break;
                    var markup = "<span id='"+$.trim(v[p])+"'>&nbsp;</span>";
                    text = text.replace(pp, markup);
                    p++;
                }
            }
            if (html) {
                $(e).html(text);
            } else {
                $(e).text(text);
            }
        }
    });
    var selector = "", sep = "";
    for (var i in self.options.attrs) {
        selector+= sep+"[lang-"+self.options.attrs[i]+"]";
        sep = ",";
    }
    $(selector, self.$el).each(function(i,e) {
        for (var i in self.options.attrs) {
            self.updateText(e, self.options.attrs[i]);
        }
    });
    self.trigger('update', {language:'language'});
};

Lang.prototype.updateText = function(e, attr) {
    var tag = $(e).attr('lang-'+attr);
    if (tag === undefined) {
        return false;
    }
    // Strip first part (lang.).
    tag = tag.substr(tag.indexOf('.')+1);
    var text = this.get(tag);
    if (typeof(text) === 'string') {
        $(e).attr(attr, text);
    }
};

Lang.prototype.trigger = function(name, data, namespace) {
    // Construct camelcased handler name
    var handler = 'on' +
        $.map([ name, namespace ], function(v) { return v && (v[0].toUpperCase() + v.slice(1).toLowerCase()); })
            .join()
    , event = $.Event(
        [ name, namespace || 'internationalize' ].join('.').toLowerCase(),
        $.extend({ relatedTarget: this }, data)
    );

    if (this.options && typeof this.options[handler] === 'function') {
        this.options[handler].apply(this, event);
    }

    return event;
};

}(jQuery));
