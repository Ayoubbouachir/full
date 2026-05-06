import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMarketplaceNotifications } from '../../hooks/useMarketplaceNotifications';
import './NotificationBell.css';

export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const { list, unreadCount, refresh, fetchUnreadCount, markAsRead, markAllAsRead } = useMarketplaceNotifications(userId);
  const panelRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => fetchUnreadCount(), 30000);
    return () => clearInterval(t);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const handleMarkAll = () => {
    markAllAsRead();
    setOpen(false);
  };

  return (
    <div className="mp-notif-wrap" ref={panelRef}>
      <button
        type="button"
        className="mp-notif-trigger"
        onClick={() => { setOpen((o) => !o); if (!open) refresh(); }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="mp-notif-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="mp-notif-badge" aria-live="polite">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="mp-notif-panel" role="dialog" aria-label="Liste des notifications">
          <div className="mp-notif-panel-header">
            <h3>Notifications</h3>
            {list.length > 0 && (
              <button type="button" className="mp-notif-mark-all" onClick={handleMarkAll}>
                Tout marquer lu
              </button>
            )}
          </div>
          <ul className="mp-notif-list">
            {list.length === 0 && (
              <li className="mp-notif-empty">Aucune notification</li>
            )}
            {list.slice(0, 15).map((n) => (
              <li key={n._id} className={n.read ? 'read' : ''}>
                <Link
                  to={n.referenceId ? `/marketplace/requests/${n.referenceId}` : '/marketplace/dashboard'}
                  className="mp-notif-item"
                  onClick={() => { markAsRead(n._id); setOpen(false); }}
                >
                  <span className="mp-notif-type">{n.type}</span>
                  <span className="mp-notif-title">{n.title || n.type}</span>
                  {n.body && <span className="mp-notif-body">{n.body}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
