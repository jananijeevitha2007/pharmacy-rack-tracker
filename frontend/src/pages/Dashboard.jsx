import { useState, useEffect } from 'react';
import { Pill, Layers, Package, Building2, Clock, AlertTriangle, TrendingDown, RefreshCw, Loader2, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { dashboardAPI } from '../services/api';

const statConfigs = [
  { key: 'total_medications', label: 'Total Medications', icon: Pill, color: 'primary' },
  { key: 'total_racks', label: 'Total Racks', icon: Layers, color: 'success' },
  { key: 'total_quantity', label: 'Total Quantity', icon: Package, color: 'primary' },
  { key: 'zones', label: 'Zones', icon: Building2, color: 'primary' },
  { key: 'total_revenue', label: 'Total Revenue', icon: DollarSign, color: 'success', prefix: '₹', decimals: 2 },
  { key: 'total_bills', label: 'Total Bills', icon: Receipt, color: 'primary' },
  { key: 'today_revenue', label: "Today's Revenue", icon: TrendingUp, color: 'success', prefix: '₹', decimals: 2 },
  { key: 'today_bills', label: "Today's Bills", icon: Receipt, color: 'primary' },
  { key: 'expiring_soon', label: 'Expiring Soon', icon: Clock, color: 'warning' },
  { key: 'expired', label: 'Expired', icon: AlertTriangle, color: 'danger' },
  { key: 'low_stock', label: 'Low Stock', icon: TrendingDown, color: 'warning' },
];

const colorMap = {
  primary: { bg: '#eff6ff', border: '#2563eb', iconColor: '#2563eb' },
  success: { bg: '#f0fdf4', border: '#16a34a', iconColor: '#16a34a' },
  warning: { bg: '#fffbeb', border: '#ea580c', iconColor: '#ea580c' },
  danger: { bg: '#fef2f2', border: '#dc2626', iconColor: '#dc2626' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="loading-screen">
        <Loader2 size={28} className="spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Overview</h1>
        <button className="btn btn-outline" onClick={loadStats} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        {statConfigs.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <div className="stat-card" key={stat.key} style={{ borderLeft: `4px solid ${colors.border}` }}>
              <div className="stat-top">
                <div className="stat-icon-circle" style={{ background: colors.bg, color: colors.iconColor }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-value">
                {stat.prefix || ''}{stat.decimals ? (stats?.[stat.key] ?? 0).toFixed(stat.decimals) : (stats?.[stat.key] ?? 0)}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
