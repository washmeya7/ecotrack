(function () {
    const STORAGE_KEY = "ecotrack_dark_mode";

    function applyTheme(isDark) {
        document.body.classList.toggle("dark-mode", isDark);

        const button = document.getElementById("ecoDarkModeToggle");

        if (button) {
            button.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
            button.setAttribute("aria-pressed", String(isDark));
        }
    }

    function initializeDarkMode() {
        const savedMode = localStorage.getItem(STORAGE_KEY);
        const isDark = savedMode === "true";

        const button = document.createElement("button");
        button.type = "button";
        button.id = "ecoDarkModeToggle";
        button.setAttribute("aria-label", "Toggle dark mode");

        document.body.appendChild(button);
        applyTheme(isDark);

        button.addEventListener("click", function () {
            const nextMode = !document.body.classList.contains("dark-mode");

            localStorage.setItem(STORAGE_KEY, String(nextMode));
            applyTheme(nextMode);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeDarkMode);
    } else {
        initializeDarkMode();
    }
})();