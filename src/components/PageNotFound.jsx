/* PageNotFound — this page left you on read. */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  return (
    <main className="pnf">
      <div className="pnf-card">
        <div className="sticker sticker-pink rotate-l">404</div>
        <h1 className="display-xl">this page left you on read.</h1>
        <p className="pnf-sub">
          the url you typed does not exist, never existed, and is honestly kind of embarrassing.
        </p>
        <div className="pnf-actions">
          <Link to="/" className="btn btn-accent">
            <ArrowLeft size={15} strokeWidth={2.5} /> take me home
          </Link>
          <Link to="/app" className="btn">
            straight to the app
          </Link>
        </div>
      </div>
    </main>
  );
}
