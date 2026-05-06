import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './MarketplaceLayout.css';

const MARKETPLACE_BASE = '/marketplace';

export default function MarketplaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const isEngineer = user?.role === 'Engineer';
  const isArtisan = user?.role === 'Artisan';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const navTabs = [
    ...(isEngineer
      ? [
          { path: `${MARKETPLACE_BASE}/dashboard`, label: 'Tableau de bord' },


        ]
      : []),
    ...(isArtisan
      ? [
          { path: `${MARKETPLACE_BASE}/dashboard`, label: 'Tableau de bord' },
          { path: '/artisan/missions', label: 'Mes Missions Directes' },
          { path: `${MARKETPLACE_BASE}/available`, label: 'Demandes correspondantes' },
          { path: `${MARKETPLACE_BASE}/offers`, label: 'Mes offres' },
        ]
      : []),
    ...(isEngineer || isArtisan ? [] : [
      { path: `${MARKETPLACE_BASE}/dashboard`, label: 'Marketplace' },
    ]),
  ];

  return (
    <div className="mp-layout">
      <header className="mp-header">
        <div className="mp-header-inner">
          <Link to={MARKETPLACE_BASE} className="mp-logo">
            Marketplace
          </Link>
          <nav className="mp-nav" aria-label="Navigation principale">
            <ul className="mp-nav-list">
              {navTabs.map((tab) => (
                <li key={tab.path}>
                  <Link
                    to={tab.path}
                    className={`mp-nav-link ${location.pathname === tab.path || (tab.path !== MARKETPLACE_BASE && location.pathname.startsWith(tab.path)) ? 'active' : ''}`}
                    aria-current={location.pathname === tab.path ? 'page' : undefined}
                  >
                    {tab.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mp-header-actions">
            <button 
              onClick={() => {
                const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                window.location.reload(); // Force reload to apply theme everywhere if needed, or just let CSS handle it
              }}
              className="mp-action-btn"
              title="Toggle Theme"
            >
              {document.documentElement.getAttribute('data-theme') === 'dark' ? "☀️" : "🌙"}
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-magnifier'))} 
              className="mp-action-btn"
              title="Loupe"
            >
              🔍
            </button>
            <NotificationBell userId={user._id} />
            <button
              type="button"
              className="mp-mobile-toggle"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-label="Ouvrir le menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="mp-mobile-nav" role="navigation">
            {navTabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className="mp-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="mp-main" id="marketplace-main">
        <Outlet />
      </main>
    </div>
  );
}
