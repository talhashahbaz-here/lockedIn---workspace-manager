/* Frontend layout — header + routed page + footer + the running marquee. */

import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Frontend() {
  return (
    <div className="frontend" id="top">
      <Header />
      <div className="marquee marquee-accent" aria-hidden>
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              kanban fr fr ✳ zero backend ✳ your todo list but it slaps ✳ ship it before lunch ✳
              minimal brutalism only ✳ no cap ✳&nbsp;
            </span>
          ))}
        </div>
      </div>
      <Outlet />
      <Footer />
    </div>
  );
}
