import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

export function useMarketplaceNotifications(userId) {
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchList = useCallback(() => {
    if (!userId) return;
    fetch(`${API_BASE}/notifications`, { headers: { 'x-user-id': userId } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setList);
  }, [userId]);

  const fetchUnreadCount = useCallback(() => {
    if (!userId) return;
    fetch(`${API_BASE}/notifications/unread-count`, { headers: { 'x-user-id': userId } })
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data) => setUnreadCount(data.count || 0));
  }, [userId]);

  useEffect(() => {
    fetchList();
    fetchUnreadCount();
  }, [fetchList, fetchUnreadCount]);

  const markAsRead = (id) => {
    fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST', headers: { 'x-user-id': userId } }).then(fetchUnreadCount);
  };

  const markAllAsRead = () => {
    fetch(`${API_BASE}/notifications/read-all`, { method: 'POST', headers: { 'x-user-id': userId } }).then(() => {
      fetchUnreadCount();
      fetchList();
    });
  };

  return { list, unreadCount, refresh: fetchList, fetchUnreadCount, markAsRead, markAllAsRead };
}
