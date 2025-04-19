document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.navigation');
    const navLinks = document.querySelectorAll('.navigation li a');

    // Mobile Menu Toggle
    menuToggle.addEventListener('click', () => {
        navigation.classList.toggle('active');
    });

    // Highlight Active Link
    const currentUrl = window.location.pathname.split('/').pop();
    navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === currentUrl || (currentUrl === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Smooth Scroll Effect for Navigation Links
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');
        });
    });
});

// Check if dark mode is enabled in localStorage
const currentMode = localStorage.getItem('mode') || 'light';

// Apply the saved mode to the body
if (currentMode === 'dark') {
    document.body.classList.add('dark-mode');
}

// Toggle Dark Mode when logo is clicked
document.getElementById('logo').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');

    // Save the mode in localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('mode', 'dark');
    } else {
        localStorage.setItem('mode', 'light');
    }
});
// Add this in your script.js or a <script> tag


