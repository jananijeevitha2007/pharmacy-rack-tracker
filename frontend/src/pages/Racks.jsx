import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Layers, MapPin, LayoutGrid } from 'lucide-react';
import { racksAPI } from '../services/api';

export default function Racks() {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', zone: '', shelf_count: 1, location: '' });

  useEffect(() => {
    loadRacks();
  }, []);

  const loadRacks = async () => {
    try {
      const res = await racksAPI.getAll();
      setRacks(res.data);
    } catch (err) {
      console.error('Failed to load racks:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', zone: '', shelf_count: 1, location: '' });
    setShowModal(true);
  };

  const openEdit = (rack) => {
    setEditing(rack);
    setForm({
      name: rack.name,
      zone: rack.zone,
      shelf_count: rack.shelf_count,
      location: rack.location || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = { ...form, shelf_count: parseInt(form.shelf_count) };

    try {
      if (editing) {
        await racksAPI.update(editing.id, data);
      } else {
        await racksAPI.create(data);
      }
      setShowModal(false);
      loadRacks();
    } catch (err) {
      alert(err.response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? Medications in this rack will be unassigned.`)) return;
    try {
      await racksAPI.delete(id);
      loadRacks();
    } catch (err) {
      alert('Failed to delete rack');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={28} className="spin" />
        <p>Loading racks...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Racks</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Add Rack
        </button>
      </div>

      {racks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Layers size={40} />
            <p>No racks yet</p>
            <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ marginTop: 12 }}>
              <Plus size={16} /> Add your first rack
            </button>
          </div>
        </div>
      ) : (
        <div className="rack-grid-card">
          {racks.map((rack) => (
            <div className="rack-card" key={rack.id}>
              <div className="rack-card-header">
                <div className="rack-icon">
                  <Layers size={20} />
                </div>
                <div className="rack-title">
                  <h3>{rack.name}</h3>
                  <span className="badge badge-info">{rack.zone}</span>
                </div>
                <div className="icon-actions">
                  <button className="icon-btn edit-btn" onClick={() => openEdit(rack)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn delete-btn" onClick={() => handleDelete(rack.id, rack.name)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="rack-card-body">
                <div className="rack-stats">
                  <div className="rack-stat">
                    <LayoutGrid size={16} className="rack-stat-icon" />
                    <div>
                      <span className="rack-stat-value">{rack.shelf_count}</span>
                      <span className="rack-stat-label">Shelves</span>
                    </div>
                  </div>
                  <div className="rack-stat">
                    <span className="rack-stat-icon med-count">{rack.medication_count}</span>
                    <div>
                      <span className="rack-stat-value">{rack.medication_count}</span>
                      <span className="rack-stat-label">Meds</span>
                    </div>
                  </div>
                </div>
                {rack.location && (
                  <div className="rack-location">
                    <MapPin size={14} />
                    <span>{rack.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Rack' : 'Add Rack'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rack Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g., Rack-A1" />
                </div>
                <div className="form-group">
                  <label>Zone *</label>
                  <input type="text" value={form.zone} onChange={(e) => setForm({...form, zone: e.target.value})} required placeholder="e.g., Zone-1, Cold Storage" />
                </div>
                <div className="form-group">
                  <label>Number of Shelves</label>
                  <input type="number" value={form.shelf_count} onChange={(e) => setForm({...form, shelf_count: e.target.value})} min="1" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g., Building A, Floor 2" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting && <Loader2 size={16} className="spin" />}
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
