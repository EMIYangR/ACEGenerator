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
        document.documentElement.lang = current === "zh" ? "zh-CN" : "en";
        document.title = t("pageTitle");
        document.body.classList.toggle("lang-zh", current === "zh");
        document.querySelectorAll("[data-i18n]").forEach(function (node) {
            node.textContent = t(node.getAttribute("data-i18n"));
        });
        document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
            node.innerHTML = t(node.getAttribute("data-i18n-html"));
        });
        document.querySelectorAll("[data-i18n-ph]").forEach(function (node) {
            node.placeholder = t(node.getAttribute("data-i18n-ph"));
        });
        var toggle = document.getElementById("langToggle");
        if (toggle) toggle.textContent = current === "zh" ? "EN" : "中文";
    }

    function load(language) {
        current = language === "en" ? "en" : "zh";
        window.localStorage.setItem("aceLang", current);
        apply();
        document.dispatchEvent(new CustomEvent("i18n:applied", { detail: current }));
        return current;
    }

    function reset() {
        current = "en";
        apply();
        document.dispatchEvent(new CustomEvent("i18n:applied", { detail: current }));
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
