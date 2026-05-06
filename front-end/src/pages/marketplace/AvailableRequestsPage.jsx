import React, { useState, useEffect, useMemo } from 'react';
import RequestCard from '../../components/marketplace/RequestCard';
import FilterBar from '../../components/marketplace/FilterBar';
import EmptyState from '../../components/marketplace/EmptyState';
import { LoadingCards } from '../../components/marketplace/LoadingCard';
import API_BASE_URL from '../../api.config';
import './Marketplace.css';

const API_BASE = process.env.REACT_APP_API_URL || API_BASE_URL;

export default function AvailableRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ profession: '', status: '', location: '', budgetRange: '' });
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = user?._id;
  const profession = user?.profession || user?.speciality || '';

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API_BASE}/service-requests/available`, {
      headers: { 'x-user-id': userId, 'x-profession': profession },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [userId, profession]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filters.profession && (r.requiredProfession || '').toLowerCase() !== filters.profession.toLowerCase()) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.location && !(r.location || '').toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.budgetRange && !(r.budgetRange || '').toLowerCase().includes(filters.budgetRange.toLowerCase())) return false;
      return true;
    });
  }, [requests, filters]);

  return (
    <div className="mp-dashboard">
      <h1 className="mp-page-title">Demandes correspondant à ma profession</h1>
      <FilterBar filters={filters} onFilterChange={setFilters} onReset={() => setFilters({ profession: '', status: '', location: '', budgetRange: '' })} />
      {loading && (
        <div className="mp-cards-grid">
          <LoadingCards count={4} />
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <EmptyState variant="no_matching" onAction={() => window.location.reload()} />
      )}
      {!loading && filtered.length > 0 && (
        <div className="mp-cards-grid">
          {filtered.map((r) => (
            <RequestCard key={r._id} request={r} showActions mode="artisan" />
          ))}
        </div>
      )}
    </div>
  );
}
