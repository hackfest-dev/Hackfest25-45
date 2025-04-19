const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

menuToggle.addEventListener('click', () => {
    navigation.classList.toggle('active');
});
//hello
const navLinks = document.querySelectorAll('.navigation li a');

// Initially set the active state for the current page link
window.addEventListener('DOMContentLoaded', () => {
    const currentUrl = window.location.pathname;
    navLinks.forEach((link) => {
        if (link.href.includes(currentUrl)) {
            link.classList.add('active');
            updateBackgroundPosition(link);
        }
    });
});

// Add active class and move the background highlight based on clicks
navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
        navLinks.forEach((nav) => nav.classList.remove('active'));
        e.currentTarget.classList.add('active');
        updateBackgroundPosition(e.currentTarget);
    });
});

// Function to update the background highlight position
function updateBackgroundPosition(link) {
    const activeLink = document.querySelector('.navigation li a.active');
    const highlight = activeLink.querySelector('::before');
    
    if (highlight) {
        const leftPosition = activeLink.offsetLeft;
        const width = activeLink.offsetWidth;

        highlight.style.left = leftPosition + 'px';
        highlight.style.width = width + 'px';
    }
}
