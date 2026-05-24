/**
 * components.js — Noah's Ark Fairview
 * Shared Components Loader (Navbar + Footer)
 */

function toggleMenu() {
  const nl = document.getElementById('navLinks');
  if (nl) nl.classList.toggle('open');
}

function loadNavbar() {
  const navbarHTML = `
  <nav>
    <div class="nav-inner">
      <a href="index.html" class="nav-logo" aria-label="Noah's Ark Home">
        <img src="logo_new.png" alt="Noah's Ark Fairview">
      </a>
      <button class="hamburger" onclick="toggleMenu()" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
      <ul class="nav-links" id="navLinks">
        <li><a href="index.html"   id="nav-home">Home</a></li>
        <li><a href="about.html"   id="nav-about">About</a></li>
        <li><a href="diocese.html" id="nav-diocese">Diocese</a></li>
        <li><a href="worship.html" id="nav-worship">Worship</a></li>
        <li><a href="project.html" id="nav-project">Future Home</a></li>
        <li><a href="events.html"  id="nav-events">Events</a></li>
        <li><a href="location.html" id="nav-location">Find Us</a></li>
      </ul>
    </div>
  </nav>`;
  const container = document.getElementById('navbar');
  if (container) { container.innerHTML = navbarHTML; setActiveNav(); }
}

function loadFooter() {
  const footerHTML = `
  <footer>
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="logo_new.png" alt="Noah's Ark Fairview">
          <p>Building a vibrant community of faith in Fairview and beyond. All are welcome beneath our roof.</p>
          <div class="footer-social">
            <a href="https://www.facebook.com/profile.php?id=61556801708456" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">
              <i class="fab fa-facebook-f"></i>
            </a>
          </div>
        </div>
        <div class="footer-col">
          <h5>Visit Us</h5>
          <ul>
            <li><a href="location.html">Location &amp; Directions</a></li>
            <li><a href="worship.html">Service Times</a></li>
            <li><a href="about.html#contact">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h5>Explore</h5>
          <ul>
            <li><a href="about.html">Our Story</a></li>
            <li><a href="diocese.html">Diocese Info</a></li>
            <li><a href="project.html">Future Home</a></li>
            <li><a href="events.html">Events &amp; Notices</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h5>Worship</h5>
          <ul>
            <li><a href="worship.html">Sunday Services</a></li>
            <li><a href="worship.html#readings">Scripture Readings</a></li>
            <li><a href="worship.html">Ministry Roles</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Noah's Ark Anglican Church, Fairview. Proudly serving our parish.</p>
        <a href="admin.html" class="footer-scripture" style="text-decoration:none; cursor:pointer;">"I am the way, the truth, and the life." — John 14:6</a>
      </div>
    </div>
  </footer>`;
  const container = document.getElementById('footer');
  if (container) container.innerHTML = footerHTML;
}

function setActiveNav() {
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const map = {
    'index.html':    'nav-home',
    '':              'nav-home',
    'about.html':    'nav-about',
    'diocese.html':  'nav-diocese',
    'worship.html':  'nav-worship',
    'project.html':  'nav-project',
    'events.html':   'nav-events',
    'location.html': 'nav-location',
  };
  const id = map[page];
  if (id) { const el = document.getElementById(id); if (el) el.classList.add('active'); }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNavbar();
  loadFooter();
});
