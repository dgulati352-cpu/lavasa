import React from 'react';
import { Clock, CheckCircle, Package } from 'lucide-react';

const AdminView = ({ orders, updateOrderStatus }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state glass-panel" style={{ marginTop: '2rem' }}>
        <Package size={64} opacity={0.2} />
        <h2>No Active Orders</h2>
        <p>Waiting for customers to place orders...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'var(--accent-primary)';
      case 'preparing': return 'var(--accent-warning)';
      case 'prepared': return 'var(--accent-success)';
      case 'delivered': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Kitchen Orders
      </h2>
      <div className="orders-grid">
        {orders.map(order => (
          <div key={order.id} className="order-card glass-panel" style={{ borderTop: `4px solid ${getStatusColor(order.status)}` }}>
            <div className="order-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Table {order.table_number || order.tableNumber || 'N/A'}</h3>
                {order.userName && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '0.1rem' }}>
                    {order.userName}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <Clock size={14} /> {formatTime(order.timestamp || order.time)} | #{order.id?.toString().slice(-4)}
                </div>
              </div>
              <span className={`badge badge-${order.status || 'pending'}`}>{order.status || 'pending'}</span>
            </div>
            
            <div className="order-items">
              {(order.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.name}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Total: ₹{order.total_amount || order.total || 0}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.payment_method || order.paymentDetails?.method || 'Paid Online'}</span>
            </div>

            <div className="order-actions">
              {(order.status === 'pending' || order.status === 'accepted') && (
                <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => updateOrderStatus(order.id, 'preparing')}>
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button className="btn-success" style={{ flex: 1, padding: '0.5rem' }} onClick={() => updateOrderStatus(order.id, 'prepared')}>
                  <CheckCircle size={16} /> Mark Prepared
                </button>
              )}
              {order.status === 'prepared' && (
                <button className="btn-outline" style={{ flex: 1, padding: '0.5rem' }} onClick={() => updateOrderStatus(order.id, 'delivered')}>
                  Mark Delivered
                </button>
              )}
              {order.status === 'delivered' && (
                <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Order completed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminView;
