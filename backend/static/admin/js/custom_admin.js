/**
 * FS Store Admin — Custom Theme Toggle
 * Adds a sun/moon button to the navbar for light/dark mode switching.
 * Uses body.fs-light-mode class (our CSS variable set) as the light override.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'fs_admin_theme';

    function applyTheme(isDark) {
        if (isDark) {
            document.body.classList.remove('fs-light-mode');
        } else {
            document.body.classList.add('fs-light-mode');
        }
        updateButton(isDark);
    }

    function updateButton(isDark) {
        var btn = document.getElementById('fs-theme-toggle');
        if (!btn) return;
        if (isDark) {
            btn.innerHTML = '&#9728;'; // ☀ sun
            btn.title = 'Switch to Light Mode';
            btn.style.color = '#f59e0b';
        } else {
            btn.innerHTML = '&#9790;'; // ☾ moon
            btn.title = 'Switch to Dark Mode';
            btn.style.color = '#818cf8';
        }
    }

    function init() {
        // Don't add twice
        if (document.getElementById('fs-theme-toggle')) return;

        // Read saved preference (default is dark)
        var saved = localStorage.getItem(STORAGE_KEY);
        var isDark = saved !== 'light'; // default dark

        // Apply on page load
        applyTheme(isDark);

        // Build button
        var btn = document.createElement('a');
        btn.id = 'fs-theme-toggle';
        btn.href = '#';
        btn.className = 'nav-link';
        btn.style.cssText = [
            'display:inline-flex',
            'align-items:center',
            'justify-content:center',
            'width:32px',
            'height:32px',
            'border-radius:8px',
            'border:1px solid rgba(255,255,255,0.10)',
            'font-size:16px',
            'cursor:pointer',
            'transition:all 0.2s',
            'text-decoration:none',
            'margin-top:2px',
        ].join(';');

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var nowDark = !document.body.classList.contains('fs-light-mode');
            // toggle
            nowDark ? applyTheme(false) : applyTheme(true);
            localStorage.setItem(STORAGE_KEY, document.body.classList.contains('fs-light-mode') ? 'light' : 'dark');
        });

        updateButton(isDark);

        // Insert into navbar right side
        // Support Bootstrap 4 (.ml-auto) and Bootstrap 5 (.ms-auto)
        var navbarRight = document.querySelector(
            '.main-header .navbar-nav.ml-auto, ' +
            '.main-header .navbar-nav.ms-auto, ' +
            '.main-header .navbar-right, ' +
            '.main-header .navbar-nav:last-child'
        );
        if (navbarRight) {
            var li = document.createElement('li');
            li.className = 'nav-item d-flex align-items-center';
            li.appendChild(btn);
            navbarRight.insertBefore(li, navbarRight.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
