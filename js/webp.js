(function () {
    var html = document.documentElement;
    var test = new Image();
    test.onload = function () {
        html.classList.add(test.width > 0 && test.height > 0 ? "webp" : "no-webp");
    };
    test.onerror = function () {
        html.classList.add("no-webp");
    };
    test.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
})();
