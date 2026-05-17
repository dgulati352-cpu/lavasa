import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, Banknote, Zap, Wallet, Apple, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentModal = ({ total, cartTotal, discountAmount, promoInput, setPromoInput, handleApplyPromo, promoError, appliedPromo, setAppliedPromo, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'cash', 'apple-pay', 'google-pay'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePay = (e) => {
    e.preventDefault();
    if (paymentMethod === 'cash') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setTimeout(() => onSuccess({ method: 'Pay at Counter' }), 1500);
      }, 2000);
      return;
    }

    if (!window.Razorpay) {
      alert("Payment gateway failed to load. Please check your connection.");
      return;
    }

    setIsProcessing(true);

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummy_key", 
      amount: Math.round(total * 100), 
      currency: "INR",
      name: "FlavorFusion Premium",
      description: "Food Order Payment",
      handler: function (response) {
        setIsProcessing(false);
        setIsSuccess(true);
        let methodLabel = 'Online Payment';
        if (paymentMethod === 'card') methodLabel = 'Credit/Debit Card';
        if (paymentMethod === 'upi' || paymentMethod === 'google-pay') methodLabel = 'UPI';
        if (paymentMethod === 'apple-pay') methodLabel = 'Apple Pay';
        setTimeout(() => onSuccess({ method: methodLabel, paymentId: response.razorpay_payment_id }), 1500);
      },
      prefill: {
        name: "Guest",
        contact: "9999999999"
      },
      theme: {
        color: "#10b981"
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response){
      alert("Payment failed: " + response.error.description);
      setIsProcessing(false);
    });
    rzp.open();
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <CheckCircle size={64} color="var(--accent-success)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: 'var(--accent-success)', marginBottom: '0.5rem' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your order is being sent to the kitchen.</p>
        </div>
      </div>
    );
  }

  const methods = [
    { id: 'upi', label: 'UPI / Paytm', icon: Zap },
    { id: 'google-pay', label: 'Google Pay', icon: Smartphone },
    { id: 'apple-pay', label: 'Apple Pay', icon: Apple },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'cash', label: 'Counter', icon: Banknote },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-content glass-panel" 
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <h2 style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.75rem', fontWeight: 800 }}>Secure Checkout</h2>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--accent-primary-glow)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Amount Due</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>₹{total}</div>
          {appliedPromo && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600, marginTop: '0.25rem' }}>
              Original: ₹{cartTotal} | Discount: -₹{discountAmount}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Have a Promo Code?</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="search-bar" style={{ flex: 1, marginBottom: 0, background: 'var(--bg-input)' }}>
              <Ticket size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Enter code" 
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                style={{ height: '40px', fontSize: '0.9rem' }}
              />
            </div>
            <button type="button" className="btn-primary" style={{ padding: '0 1rem', height: '40px' }} onClick={handleApplyPromo}>Apply</button>
          </div>
          {promoError && <p style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{promoError}</p>}
          {appliedPromo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 700 }}>
                <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {appliedPromo.code} Applied
              </span>
              <button type="button" onClick={() => setAppliedPromo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>
                &times;
              </button>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Select Payment Method</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {methods.map(m => (
            <button 
              key={m.id}
              className={`btn-outline ${paymentMethod === m.id ? 'active' : ''}`}
              style={{ 
                padding: '0.75rem 0.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.5rem', 
                height: 'auto',
                borderWidth: '2px',
                background: paymentMethod === m.id ? 'var(--accent-primary-glow)' : 'var(--bg-input)',
                borderColor: paymentMethod === m.id ? 'var(--accent-primary)' : 'transparent',
                color: paymentMethod === m.id ? 'var(--accent-primary)' : 'var(--text-muted)'
              }}
              onClick={() => setPaymentMethod(m.id)}
            >
              <m.icon size={20} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{m.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handlePay}>
          <AnimatePresence mode="wait">
            <motion.div
              key={paymentMethod}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {paymentMethod === 'cash' ? (
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Banknote size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>Please pay ₹{total} at the billing counter after finishing your meal. Your order will be sent to the kitchen immediately.</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  <Zap size={32} style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }} />
                  <p>You will be securely redirected to Razorpay to complete your payment using {methods.find(m=>m.id === paymentMethod)?.label}.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn-outline" style={{ flex: 1, height: '54px' }} onClick={onClose} disabled={isProcessing}>
              Back
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2, height: '54px', fontWeight: 800 }} disabled={isProcessing}>
              {isProcessing ? 'Verifying...' : paymentMethod === 'cash' ? 'Confirm Order' : `Pay ₹${total}`}
            </button>
          </div>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <CheckCircle size={14} /> 256-bit SSL Secure Payment
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
