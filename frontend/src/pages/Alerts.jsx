import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, AlertOctagon, CheckCircle2, Layers, CalendarClock, Package } from 'lucide-react';
import { medicationsAPI } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await medicationsAPI.getExpiring();
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = alerts.filter(a => {
    if (filter === 'expired') return a.is_expired;
    if (filter === 'expiring') return a.is_expiring_soon;
    return true;
  });

  const counts = {
    all: alerts.length,
    expired: alerts.filter(a => a.is_expired).length,
    expiring: alerts.filter(a => a.is_expiring_soon).length,
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={28} className="spin" />
        <p>Loading alerts...</p>
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: 'All Alerts', icon: AlertTriangle },
    { key: 'expired', label: 'Expired', icon: AlertOctagon },
    { key: 'expiring', label: 'Expiring Soon', icon: CalendarClock },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Alerts</h1>
      </div>

      <div className="alert-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              className={`alert-tab ${isActive ? 'active' : ''} ${tab.key === 'expired' && isActive ? 'danger' : ''} ${tab.key === 'expiring' && isActive ? 'warning' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className={`alert-tab-count ${tab.key === 'expired' ? 'danger' : tab.key === 'expiring' ? 'warning' : ''}`}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><CheckCircle2 size={44} style={{ color: '#16a34a' }} /></div>
            <p>All clear! No alerts found.</p>
          </div>
        </div>
      ) : (
        filtered.map((med) => {
          const days = daysUntil(med.expiry_date);
          return (
            <div key={med.id} className={`alert-card ${med.is_expired ? 'expired' : 'expiring'}`}>
              <div className="alert-icon">
                {med.is_expired
                  ? <AlertOctagon size={22} style={{ color: '#dc2626' }} />
                  : <AlertTriangle size={22} style={{ color: '#ea580c' }} />}
              </div>
              <div className="alert-info">
                <div className="alert-title-row">
                  <h3>{med.name}</h3>
                  <span className={`badge ${med.is_expired ? 'badge-danger' : 'badge-warning'}`}>
                    {med.is_expired ? 'EXPIRED' : days <= 7 ? 'CRITICAL' : 'EXPIRING SOON'}
                  </span>
                </div>
                <div className="alert-meta">
                  <span className="alert-meta-item">
                    <CalendarClock size={14} />
                    {med.is_expired ? `Expired on ${formatDate(med.expiry_date)}` : `Expires in ${days} days (${formatDate(med.expiry_date)})`}
                  </span>
                  {med.rack_name && (
                    <span className="alert-meta-item">
                      <Layers size={14} />
                      {med.rack_name} · Shelf {med.shelf_number}
                    </span>
                  )}
                  <span className="alert-meta-item">
                    <Package size={14} />
                    {med.quantity} {med.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
