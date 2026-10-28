import { useState, useEffect } from 'react';
import { Plus, Search, X, Loader2, Receipt, CreditCard, Wallet, Ban, Eye, User, Phone, CheckCircle2, Minus } from 'lucide-react';
import { billsAPI, medicationsAPI } from '../services/api';

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'insurance', label: 'Insurance', icon: Receipt },
];

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailBill, setDetailBill] = useState(null);

  const [billForm, setBillForm] = useState({
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    discount: 0,
    items: [],
  });

  const [itemSearch, setItemSearch] = useState('');
  const [medSearch, setMedSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsRes, medsRes] = await Promise.all([
        billsAPI.getAll(),
        medicationsAPI.getAll()
      ]);
      setBills(billsRes.data);
      setMedications(medsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setBillForm({
      customer_name: '',
      customer_phone: '',
      payment_method: 'cash',
      discount: 0,
      items: [],
    });
    setMedSearch('');
    setShowCreate(true);
  };

  const addItem = (med) => {
    const existing = billForm.items.find(i => i.medication_id === med.id);
    if (existing) {
      setBillForm({
        ...billForm,
        items: billForm.items.map(i =>
          i.medication_id === med.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      setBillForm({
        ...billForm,
        items: [...billForm.items, { medication_id: med.id, quantity: 1 }]
      });
    }
  };

  const updateItemQty = (medId, delta) => {
    setBillForm({
      ...billForm,
      items: billForm.items
        .map(i => {
          if (i.medication_id === medId) {
            const newQty = i.quantity + delta;
            return { ...i, quantity: newQty > 0 ? newQty : 0 };
          }
          return i;
        })
        .filter(i => i.quantity > 0)
    });
  };

  const removeItem = (medId) => {
    setBillForm({
      ...billForm,
      items: billForm.items.filter(i => i.medication_id !== medId)
    });
  };

  const getMed = (id) => medications.find(m => m.id === id);

  const effSubtotal = billForm.items.reduce((sum, item) => {
    const med = getMed(item.medication_id);
    return sum + (med ? med.price * item.quantity : 0);
  }, 0);

  const discount = Math.min(parseFloat(billForm.discount) || 0, effSubtotal);
  const total = effSubtotal - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (billForm.items.length === 0) {
      alert('Add at least one item to the bill');
      return;
    }
    try {
      await billsAPI.create({
        customer_name: billForm.customer_name || null,
        customer_phone: billForm.customer_phone || null,
        payment_method: billForm.payment_method,
        discount: parseFloat(billForm.discount) || 0,
        items: billForm.items,
      });
      setShowCreate(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create bill');
    }
  };

  const handleVoid = async (bill) => {
    if (!confirm(`Void bill ${bill.bill_number}? Stock will be restored.`)) return;
    try {
      await billsAPI.void(bill.id);
      loadData();
    } catch (err) {
      alert('Failed to void bill');
    }
  };

  const filteredMeds = medications.filter(m => {
    const query = medSearch.toLowerCase();
    return (
      m.quantity > 0 &&
      !m.is_expired &&
      (m.name.toLowerCase().includes(query) ||
        (m.generic_name && m.generic_name.toLowerCase().includes(query)))
    );
  });

  const filteredBills = bills.filter(b =>
    b.bill_number.toLowerCase().includes(search.toLowerCase()) ||
    (b.customer_name && b.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const currency = (n) => `₹${Number(n).toFixed(2)}`;

  const getPaymentIcon = (method) => {
    const m = paymentMethods.find(p => p.value === method);
    return m ? m : paymentMethods[0];
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={28} className="spin" />
        <p>Loading billing...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Billing</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          New Bill
        </button>
      </div>

      <div className="card search-card">
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search by bill number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <Receipt size={40} />
                      <p>No bills found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const PayIcon = getPaymentIcon(bill.payment_method).icon;
                  return (
                    <tr key={bill.id} style={{ opacity: bill.status === 'voided' ? 0.5 : 1 }}>
                      <td><strong>{bill.bill_number}</strong></td>
                      <td>{bill.customer_name || <span className="text-muted">Walk-in</span>}</td>
                      <td>{bill.items.length}</td>
                      <td>
                        <span className="payment-cell">
                          <PayIcon size={14} />
                          {bill.payment_method}
                        </span>
                      </td>
                      <td><strong>{currency(bill.total)}</strong></td>
                      <td>{formatDate(bill.created_at)}</td>
                      <td>
                        {bill.status === 'voided'
                          ? <span className="badge badge-danger">Voided</span>
                          : <span className="badge badge-success">Completed</span>}
                      </td>
                      <td>
                        <div className="icon-actions">
                          <button className="icon-btn" onClick={() => setDetailBill(bill)} title="View bill">
                            <Eye size={16} />
                          </button>
                          {bill.status !== 'voided' && (
                            <button className="icon-btn delete-btn" onClick={() => handleVoid(bill)} title="Void bill">
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BILL MODAL */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal bill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Bill</h2>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="bill-modal-body">
                {/* Customer info */}
                <div className="grid-2">
                  <div className="form-group">
                    <label>Customer Name</label>
                    <div className="input-group-inline">
                      <User size={15} />
                      <input
                        type="text"
                        value={billForm.customer_name}
                        onChange={(e) => setBillForm({...billForm, customer_name: e.target.value})}
                        placeholder="Customer name"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <div className="input-group-inline">
                      <Phone size={15} />
                      <input
                        type="text"
                        value={billForm.customer_phone}
                        onChange={(e) => setBillForm({...billForm, customer_phone: e.target.value})}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="payment-select">
                    {paymentMethods.map(m => {
                      const Icon = m.icon;
                      return (
                        <button
                          type="button"
                          key={m.value}
                          className={`payment-option ${billForm.payment_method === m.value ? 'selected' : ''}`}
                          onClick={() => setBillForm({...billForm, payment_method: m.value})}
                        >
                          <Icon size={18} />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Medication selection */}
                <div className="bill-section">
                  <div className="bill-section-header">
                    <h3>Add Medication</h3>
                  </div>
                  <div className="med-add-search">
                    <Search size={15} />
                    <input
                      type="text"
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                      placeholder="Search medications to add..."
                    />
                  </div>
                  <div className="med-add-list">
                    {filteredMeds.slice(0, 8).map(med => (
                      <button
                        type="button"
                        key={med.id}
                        className="med-add-item"
                        onClick={() => addItem(med)}
                      >
                        <span className="med-add-name">
                          {med.name}
                          <small>₹{med.price.toFixed(2)} each · {med.quantity} in stock</small>
                        </span>
                        <Plus size={16} className="med-add-plus" />
                      </button>
                    ))}
                    {filteredMeds.length === 0 && (
                      <p className="text-muted" style={{ padding: 8, fontSize: 13 }}>
                        No available medications match search
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill items */}
                {billForm.items.length > 0 && (
                  <div className="bill-section">
                    <div className="bill-section-header">
                      <h3>Bill Items</h3>
                      <span className="bill-item-count">{billForm.items.length} item{billForm.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="bill-items">
                      {billForm.items.map(item => {
                        const med = getMed(item.medication_id);
                        if (!med) return null;
                        return (
                          <div className="bill-item" key={item.medication_id}>
                            <div className="bill-item-info">
                              <strong>{med.name}</strong>
                              <small>{currency(med.price)} × {item.quantity}</small>
                            </div>
                            <div className="bill-item-controls">
                              <button type="button" className="qty-btn" onClick={() => updateItemQty(item.medication_id, -1)}>
                                <Minus size={14} />
                              </button>
                              <span className="qty-value">{item.quantity}</span>
                              <button type="button" className="qty-btn" onClick={() => updateItemQty(item.medication_id, 1)}>
                                <Plus size={14} />
                              </button>
                              <span className="bill-item-line">= {currency(med.price * item.quantity)}</span>
                              <button type="button" className="icon-btn delete-btn qty-remove" onClick={() => removeItem(item.medication_id)}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Totals */}
                {billForm.items.length > 0 && (
                  <div className="bill-totals">
                    <div className="bill-total-row">
                      <span>Subtotal</span>
                      <span>{currency(effSubtotal)}</span>
                    </div>
                    <div className="bill-total-row">
                      <span>Discount (₹)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={billForm.discount}
                        onChange={(e) => setBillForm({...billForm, discount: e.target.value})}
                        className="discount-input"
                      />
                    </div>
                    {discount > 0 && (
                      <div className="bill-total-row">
                        <span>Discount Applied</span>
                        <span className="text-success">-{currency(discount)}</span>
                      </div>
                    )}
                    <div className="bill-total-row grand-total">
                      <span>Total</span>
                      <span>{currency(total)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={billForm.items.length === 0}>
                  <CheckCircle2 size={16} />
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW BILL MODAL */}
      {detailBill && (
        <div className="modal-overlay" onClick={() => setDetailBill(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bill {detailBill.bill_number}</h2>
              <button className="icon-btn" onClick={() => setDetailBill(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="receipt">
                <div className="receipt-header">
                  <div className="receipt-logo"><Receipt size={24} /></div>
                  <h3>Pharmacy Rack Tracker</h3>
                  <p className="receipt-sub">Pharmacy Bill</p>
                </div>

                <div className="receipt-meta">
                  <div className="receipt-row">
                    <span>Bill #:</span>
                    <strong>{detailBill.bill_number}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Date:</span>
                    <span>{formatDate(detailBill.created_at)}</span>
                  </div>
                  {detailBill.customer_name && (
                    <div className="receipt-row">
                      <span>Customer:</span>
                      <span>{detailBill.customer_name}</span>
                    </div>
                  )}
                  {detailBill.customer_phone && (
                    <div className="receipt-row">
                      <span>Phone:</span>
                      <span>{detailBill.customer_phone}</span>
                    </div>
                  )}
                  <div className="receipt-row">
                    <span>Payment:</span>
                    <span className="capitalize">{detailBill.payment_method}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Status:</span>
                    <span className={detailBill.status === 'voided' ? 'text-danger' : 'text-success'}>
                      {detailBill.status}
                    </span>
                  </div>
                </div>

                <div className="receipt-divider" />

                <h4 className="receipt-items-title">Items</h4>
                {detailBill.items.map(item => (
                  <div className="receipt-item" key={item.id}>
                    <div>
                      <strong>{item.medication_name}</strong>
                      <small>{currency(item.unit_price)} × {item.quantity}</small>
                    </div>
                    <span>{currency(item.line_total)}</span>
                  </div>
                ))}

                <div className="receipt-divider" />

                <div className="receipt-total-row">
                  <span>Subtotal</span>
                  <span>{currency(detailBill.subtotal)}</span>
                </div>
                {detailBill.discount > 0 && (
                  <div className="receipt-total-row">
                    <span>Discount</span>
                    <span>-{currency(detailBill.discount)}</span>
                  </div>
                )}
                <div className="receipt-total-row receipt-grand">
                  <span>Total</span>
                  <span>{currency(detailBill.total)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDetailBill(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Receipt size={16} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
