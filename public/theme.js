// Applies the saved theme before first paint (loaded synchronously in <head>).
// No value stored = follow the system preference.
(function () {
  try {
    var theme = localStorage.getItem('politique2027:theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    /* storage unavailable: keep the system theme */
  }
})();
