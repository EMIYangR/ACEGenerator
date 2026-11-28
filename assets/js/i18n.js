window.I18n = (function () {
    var URL = "assets/json/lang.json";
    var dictionary = {};
    var current = window.localStorage.getItem("aceLang") === "zh" ? "zh" : "en";

    function t(key, fallback) {
        var group = dictionary[current] || {};
        var value = group[key];
        return typeof value === "string" && value.length > 0 ? value : (fallback || "");
    }

    function apply() {
        $("html").attr("lang", current === "zh" ? "zh-CN" : "en");
        $(document).attr("title", t("pageTitle"));
        $("body").toggleClass("lang-zh", current === "zh");
        $("[data-i18n]").each(function () {
            $(this).text(t($(this).attr("data-i18n")));
        });
        $("[data-i18n-html]").each(function () {
            $(this).html(t($(this).attr("data-i18n-html")));
        });
        $("[data-i18n-ph]").each(function () {
            $(this).attr("placeholder", t($(this).attr("data-i18n-ph")));
        });
        $("#langToggle").text(current === "zh" ? "EN" : "中文");
    }

    function load(language) {
        current = language === "en" ? "en" : "zh";
        window.localStorage.setItem("aceLang", current);
        apply();
        $(document).trigger("i18n:applied", [current]);
        return current;
    }

    function reset() {
        current = "en";
        apply();
        $(document).trigger("i18n:applied", [current]);
        return current;
    }

    var ready = fetch(URL).then(function (response) {
        return response.json();
    }).then(function (bundle) {
        dictionary = bundle;
        apply();
    });

    return { ready: ready, t: t, apply: apply, load: load, reset: reset, language: function () { return current; } };
})();
