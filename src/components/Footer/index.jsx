/* Footer — public site footer. */

import Copyright from './Copyright';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Copyright />
        <div className="footer-links">
          <a href="#top">back to top ↑</a>
          <a href="/features">the roster</a>
          <a href="/login">log in</a>
        </div>
      </div>
    </footer>
  );
}
