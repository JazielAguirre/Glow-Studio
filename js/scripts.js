(function () {
    var carrusel = document.querySelector(".carrusel");
    if (!carrusel) return;

    var slides = carrusel.querySelectorAll(".slide");
    if (slides.length < 2) return;

    var current = 0;
    var INTERVAL_MS = 4000;

    setInterval(function () {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, INTERVAL_MS);
})();
