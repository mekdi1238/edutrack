// Shared dark/light theme handling for all EduTrack pages.
// Persists the choice in localStorage so it's remembered across pages/sessions.

(function () {
    const saved = localStorage.getItem('edutrack-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';

    if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('edutrack-theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('edutrack-theme', 'dark');
    }

    updateThemeToggleLabel();
}
