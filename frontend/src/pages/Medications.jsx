import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, Loader2, SearchX, Pill } from 'lucide-react';
import { medicationsAPI, racksAPI } from '../services/api';

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRack, setFilterRack] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', generic_name: '', quantity: 0, unit: 'tablets',
    expiry_date: '', rack_id: '', shelf_number: 1, price: 0, manufacturer: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medsRes, racksRes] = await Promise.all([
        medicationsAPI.getAll(),
        racksAPI.getAll()
      ]);
      setMedications(medsRes.data);
      setRacks(racksRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterRack) params.rack_id = filterRack;
      const res = await medicationsAPI.getAll(params);
      setMedications(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [search, filterRack]);

  const clearFilters = () => {
    setSearch('');
    setFilterRack('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', generic_name: '', quantity: 0, unit: 'tablets',
      expiry_date: '', rack_id: '', shelf_number: 1, price: 0, manufacturer: ''
    });
    setShowModal(true);
  };

  const openEdit = (med) => {
    setEditing(med);
    setForm({
      name: med.name,
      generic_name: med.generic_name || '',
      quantity: med.quantity,
      unit: med.unit,
      expiry_date: med.expiry_date.split('T')[0],
      rack_id: med.rack_id || '',
      shelf_number: med.shelf_number,
      price: med.price,
      manufacturer: med.manufacturer || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      ...form,
      quantity: parseInt(form.quantity),
      shelf_number: parseInt(form.shelf_number),
      price: parseFloat(form.price),
      rack_id: form.rack_id ? parseInt(form.rack_id) : null,
      expiry_date: new Date(form.expiry_date).toISOString()
    };

    try {
      if (editing) {
        await medicationsAPI.update(editing.id, data);
      } else {
        await medicationsAPI.create(data);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await medicationsAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Failed to delete medication');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={28} className="spin" />
        <p>Loading medications...</p>
      </div>
    );
  }

  const hasFilters = search || filterRack;

  return (
    <div>
      <div className="page-header">
        <h1>Medications</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Add Medication
        </button>
      </div>

      <div className="card search-card">
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search by name, generic, manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <select value={filterRack} onChange={(e) => setFilterRack(e.target.value)}>
            <option value="">All Racks</option>
            {racks.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {hasFilters && (
            <button className="btn btn-outline btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="search-meta">
          <span>{medications.length} medication{medications.length !== 1 ? 's' : ''} found</span>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Generic</th>
                <th>Qty</th>
                <th>Expiry</th>
                <th>Rack</th>
                <th>Shelf</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <SearchX size={40} />
                      <p>{hasFilters ? 'No medications match your filters' : 'No medications yet'}</p>
                      <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: 8 }}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                medications.map((med) => (
                  <tr key={med.id}>
                    <td>
                      <div className="med-name-cell">
                        <div className="med-avatar"><Pill size={16} /></div>
                        <strong>{med.name}</strong>
                      </div>
                    </td>
                    <td>{med.generic_name || '-'}</td>
                    <td>
                      <span className={med.quantity < 10 ? 'text-danger' : ''}>{med.quantity} {med.unit}</span>
                    </td>
                    <td>{formatDate(med.expiry_date)}</td>
                    <td>{med.rack_name || <span className="text-muted">Unassigned</span>}</td>
                    <td>{med.shelf_number}</td>
                    <td>₹{med.price.toFixed(2)}</td>
                    <td>
                      {med.is_expired && <span className="badge badge-danger">Expired</span>}
                      {!med.is_expired && med.is_expiring_soon && <span className="badge badge-warning">Expiring Soon</span>}
                      {!med.is_expired && !med.is_expiring_soon && <span className="badge badge-success">Active</span>}
                    </td>
                    <td>
                      <div className="icon-actions">
                        <button className="icon-btn edit-btn" onClick={() => openEdit(med)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn delete-btn" onClick={() => handleDelete(med.id, med.name)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Medication' : 'Add Medication'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Generic Name</label>
                  <input type="text" value={form.generic_name} onChange={(e) => setForm({...form, generic_name: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})}>
                      <option value="tablets">Tablets</option>
                      <option value="capsules">Capsules</option>
                      <option value="ml">ML</option>
                      <option value="bottles">Bottles</option>
                      <option value="tubes">Tubes</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Rack</label>
                    <select value={form.rack_id} onChange={(e) => setForm({...form, rack_id: e.target.value})}>
                      <option value="">Unassigned</option>
                      {racks.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Shelf Number</label>
                    <input type="number" value={form.shelf_number} onChange={(e) => setForm({...form, shelf_number: e.target.value})} min="1" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input type="text" value={form.manufacturer} onChange={(e) => setForm({...form, manufacturer: e.target.value})} />
                  </div>
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
