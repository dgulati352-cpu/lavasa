import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, MessageSquare } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, onSubmit, orderId }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({
      orderId,
      rating,
      comment,
      timestamp: new Date().toISOString()
    });
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel"
        style={{ 
          width: '90%', 
          maxWidth: '450px', 
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '1.5rem', 
            right: '1.5rem', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--accent-primary-glow)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--accent-primary)'
          }}>
            <MessageSquare size={30} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Rate Your Order</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Order #{(orderId || '').toString().slice(-4)}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <Star 
                    size={36} 
                    fill={(hover || rating) >= star ? 'var(--accent-primary)' : 'none'} 
                    color={(hover || rating) >= star ? 'var(--accent-primary)' : 'var(--text-muted)'} 
                    style={{ transition: 'all 0.2s ease' }}
                  />
                </button>
              ))}
            </div>
            <p style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>
              Your Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              style={{ 
                width: '100%', 
                height: '120px', 
                padding: '1rem', 
                background: 'var(--bg-input)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
            style={{ width: '100%', justifyContent: 'center', padding: '1.1rem' }}
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                <Send size={18} style={{ marginRight: '0.5rem' }} />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
