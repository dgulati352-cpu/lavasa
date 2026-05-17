import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Heart, Leaf, Flame, ClipboardList, Ticket, Check, X } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import PaymentModal from './PaymentModal';
import CustomDropdown from './CustomDropdown';
import { motion, AnimatePresence } from 'framer-motion';

const getStatusProgress = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered' || s === 'completed' || s === 'picked up' || s === 'ready') return 3;
  if (s === 'preparing' || s === 'prepared') return 2;
  return 1;
};

const OrderProgressBar = ({ status }) => {
  const step = getStatusProgress(status);
  const percentage = step === 1 ? 33 : step === 2 ? 66 : 100;
  const label = step === 1 ? "Accepted" : step === 2 ? "Preparing" : "Ready";

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div className="progressive-bar-container">
        <motion.div 
          className="progressive-bar-fill" 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ background: step === 3 ? 'var(--accent-success)' : 'var(--accent-primary)' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        <span style={{ color: step >= 1 ? 'var(--accent-primary)' : '' }}>Accepted</span>
        <span style={{ color: step >= 2 ? 'var(--accent-primary)' : '' }}>Preparing</span>
        <span style={{ color: step === 3 ? 'var(--accent-success)' : '' }}>Ready</span>
      </div>
    </div>
  );
};

const CustomerView = ({ menu, cart, setCart, tableNumber, setTableNumber, onPlaceOrder, orders, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortPrice, setSortPrice] = useState('none');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tableError, setTableError] = useState(false);
  const [orderType, setOrderType] = useState('dine-in');
  // Track selected portion for each dish: { [dishId]: 'half' | 'full' }
  const [selectedPortions, setSelectedPortions] = useState({});
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [allPromos, setAllPromos] = useState([]);

  React.useEffect(() => {
    const promoRef = ref(db, 'promo_codes');
    const unsubscribe = onValue(promoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllPromos(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });
    return () => unsubscribe();
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoInput.toUpperCase().trim();
    if (!code) return;

    const promo = allPromos.find(p => p.code === code);
    if (!promo) {
      setPromoError('Invalid code');
      setAppliedPromo(null);
      return;
    }

    if (!promo.active) {
      setPromoError('Code expired');
      return;
    }

    if (new Date(promo.expiryDate) < new Date()) {
      setPromoError('Code expired');
      return;
    }

    if (cartTotal < promo.minAmount) {
      setPromoError(`Min. order ₹${promo.minAmount} required`);
      return;
    }

    if (!promo.appliesToAll && promo.applicableItems && promo.applicableItems.length > 0) {
      const hasApplicableItem = cart.some(item => promo.applicableItems.includes(item.id));
      if (!hasApplicableItem) {
        setPromoError('This code is not applicable to the items in your basket');
        return;
      }
    }

    const totalUsageCount = orders.filter(o => o.promoCode === promo.code).length;
    if (promo.usageLimit && totalUsageCount >= promo.usageLimit) {
      setPromoError('Promo code fully claimed');
      return;
    }

    if (user && promo.usageLimitPerUser) {
      const userUsageCount = orders.filter(o => o.userId === user.uid && o.promoCode === promo.code).length;
      if (userUsageCount >= promo.usageLimitPerUser) {
        setPromoError('You have reached the usage limit for this code');
        return;
      }
    }

    setAppliedPromo(promo);
    setPromoInput('');
  };

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    
    let applicableTotal = cartTotal;
    if (!appliedPromo.appliesToAll && appliedPromo.applicableItems && appliedPromo.applicableItems.length > 0) {
      applicableTotal = cart.reduce((sum, item) => {
        if (appliedPromo.applicableItems.includes(item.id)) {
          return sum + (item.price * item.quantity);
        }
        return sum;
      }, 0);
    }

    if (applicableTotal === 0) return 0;

    if (appliedPromo.type === 'percentage') {
      return Math.round((applicableTotal * appliedPromo.value) / 100);
    }
    return Math.min(appliedPromo.value, applicableTotal);
  }, [appliedPromo, cartTotal, cart]);

  const finalTotal = cartTotal - discountAmount;

  const categories = useMemo(() => {
    const cats = new Set(menu.map(item => item.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [menu]);

  const filteredAndSortedMenu = useMemo(() => {
    let result = [...menu];
    if (searchTerm) {
      result = result.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category?.toLowerCase() === filterCategory.toLowerCase());
    }
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }
    if (sortPrice === 'low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortPrice === 'high-low') {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [menu, searchTerm, filterType, filterCategory, sortPrice]);

  const addToCart = (item) => {
    if (item.weightsEnabled) {
      const portion = selectedPortions[item.id] || '250g';
      let price = item.price;
      if (portion === '250g') price = item.weight250Price;
      if (portion === '500g') price = item.weight500Price;
      if (portion === '1kg') price = item.weight1kgPrice;
      
      const cartId = `${item.id}_${portion}`;
      const existingItem = cart.find(cartItem => cartItem.cartId === cartId);
      if (existingItem) {
        setCart(cart.map(ci => ci.cartId === cartId ? { ...ci, quantity: ci.quantity + 1 } : ci));
      } else {
        setCart([...cart, { ...item, cartId, portion, price, quantity: 1 }]);
      }
    } else if (item.portionsEnabled) {
      const portion = selectedPortions[item.id] || 'half';
      const price = portion === 'half' ? item.halfPrice : item.fullPrice;
      const cartId = `${item.id}_${portion}`;
      const existingItem = cart.find(cartItem => cartItem.cartId === cartId);
      if (existingItem) {
        setCart(cart.map(ci => ci.cartId === cartId ? { ...ci, quantity: ci.quantity + 1 } : ci));
      } else {
        setCart([...cart, { ...item, cartId, portion, price, quantity: 1 }]);
      }
    } else {
      const existingItem = cart.find(cartItem => cartItem.cartId === item.id || cartItem.id === item.id);
      if (existingItem) {
        setCart(cart.map(cartItem =>
          (cartItem.cartId === item.id || cartItem.id === item.id) ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        ));
      } else {
        setCart([...cart, { ...item, cartId: item.id, quantity: 1 }]);
      }
    }
  };

  const updateQuantity = (cartId, delta) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const handleCheckout = () => {
    if (!tableNumber) {
      setTableError(true);
      setTimeout(() => setTableError(false), 2000);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setIsPaymentModalOpen(false);
    onPlaceOrder({ 
      ...paymentDetails, 
      discount: discountAmount, 
      promoCode: appliedPromo?.code || null,
      finalTotal: finalTotal,
      orderType: orderType
    });
  };

  const currentTableOrders = orders.filter(o => {
    if (user && o.userId) {
      return o.userId === user.uid;
    }
    return String(o.table_number || o.tableNumber) === String(tableNumber);
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="main-grid">
      <div className="menu-section">
        <motion.section 
          className="hero-section"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <motion.h2 
              className="hero-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              FlavorFusion Premium
            </motion.h2>
            <motion.p 
              className="hero-subtitle"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Exquisite tastes, delivered with elegance to Table {tableNumber || '??'}
            </motion.p>
          </div>
        </motion.section>

        <div className="filters glass-panel">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <CustomDropdown 
              value={filterCategory} 
              onChange={setFilterCategory} 
              options={categories.map(c => ({ 
                value: c, 
                label: c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1) 
              }))} 
            />
            <CustomDropdown 
              value={filterType} 
              onChange={setFilterType} 
              options={[
                { value: 'all', label: 'All Cuisines' },
                { value: 'veg', label: 'Veg' },
                { value: 'non-veg', label: 'Non-Veg' }
              ]} 
            />
            <CustomDropdown 
              value={sortPrice} 
              onChange={setSortPrice} 
              options={[
                { value: 'none', label: 'Sort Price' },
                { value: 'low-high', label: 'Low to High' },
                { value: 'high-low', label: 'High to Low' }
              ]} 
            />
          </div>
        </div>

        <motion.div 
          className="menu-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredAndSortedMenu.map((item) => {
            const activePortion = selectedPortions[item.id] || (item.weightsEnabled ? '250g' : 'half');
            let displayPrice = item.price;
            if (item.weightsEnabled) {
              if (activePortion === '250g') displayPrice = item.weight250Price;
              if (activePortion === '500g') displayPrice = item.weight500Price;
              if (activePortion === '1kg') displayPrice = item.weight1kgPrice;
            } else if (item.portionsEnabled) {
              displayPrice = activePortion === 'half' ? item.halfPrice : item.fullPrice;
            }
            return (
              <motion.div 
                key={item.id} 
                className="menu-card glass-panel"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="menu-img-container">
                  <img src={item.image} alt={item.name} className="menu-img" loading="lazy" />
                  <div className="menu-card-overlay" />
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                    <span className={`badge badge-${item.type}`}>
                      {item.type}
                    </span>
                  </div>
                </div>
                <div className="menu-info">
                  <p style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>{item.category}</p>
                  <h3 className="menu-title">{item.name}</h3>

                  {item.weightsEnabled ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      {['250g', '500g', '1kg'].map(w => {
                        const price = w === '250g' ? item.weight250Price : (w === '500g' ? item.weight500Price : item.weight1kgPrice);
                        if (!price) return null;
                        return (
                          <button
                            key={w}
                            onClick={() => setSelectedPortions(prev => ({ ...prev, [item.id]: w }))}
                            style={{
                              flex: 1, minWidth: '30%', padding: '4px 0', borderRadius: '20px', border: '1.5px solid var(--accent-primary)',
                              cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', transition: 'all 0.2s',
                              background: activePortion === w ? 'var(--accent-primary)' : 'transparent',
                              color: activePortion === w ? '#fff' : 'var(--accent-primary)',
                            }}
                          >
                            {w} ₹{price}
                          </button>
                        );
                      })}
                    </div>
                  ) : item.portionsEnabled && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                      {['half', 'full'].map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedPortions(prev => ({ ...prev, [item.id]: p }))}
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            borderRadius: '20px',
                            border: '1.5px solid var(--accent-primary)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                            background: activePortion === p ? 'var(--accent-primary)' : 'transparent',
                            color: activePortion === p ? '#fff' : 'var(--accent-primary)',
                          }}
                        >
                          {p} ₹{p === 'half' ? item.halfPrice : item.fullPrice}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="menu-price">₹{displayPrice}</span>
                    <motion.button 
                      className="btn-primary" 
                      onClick={() => addToCart(item)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="sidebar-section">
        <motion.div 
          className="sidebar-panel glass-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShoppingCart size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Your Basket</h2>
          </div>

          <div className="form-group">
            <label style={{ color: tableError ? 'var(--accent-danger)' : 'var(--text-main)' }}>Table Number</label>
            <input 
              type="number" 
              placeholder="Enter table..." 
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              style={tableError ? { borderColor: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.05)' } : {}}
            />
          </div>

          <div className="cart-items">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div 
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p>Your basket is empty</p>
                </motion.div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    key={item.cartId} 
                    className="cart-item"
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>
                        {item.name}
                        {item.portion && (
                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '2px 7px', borderRadius: '10px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, textTransform: 'capitalize', verticalAlign: 'middle' }}>
                            {item.portion}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>₹{item.price}</div>
                    </div>
                    <div className="cart-item-controls">
                      <button className="cart-item-btn" onClick={() => updateQuantity(item.cartId, -1)}><Minus size={14} /></button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                      <button className="cart-item-btn" onClick={() => updateQuantity(item.cartId, 1)}><Plus size={14} /></button>
                      <button className="cart-item-btn" style={{ color: 'var(--accent-danger)' }} onClick={() => removeFromCart(item.cartId)}><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {cart.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ paddingTop: '1rem', borderTop: '2px dashed var(--border-color)' }}
            >


              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg-input)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
                  <button 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', background: orderType === 'dine-in' ? 'var(--accent-primary)' : 'transparent', color: orderType === 'dine-in' ? 'white' : 'var(--text-main)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onClick={() => setOrderType('dine-in')}
                  >
                    Dine In
                  </button>
                  <button 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', background: orderType === 'takeaway' ? 'var(--accent-primary)' : 'transparent', color: orderType === 'takeaway' ? 'white' : 'var(--text-main)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onClick={() => setOrderType('takeaway')}
                  >
                    Takeaway
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                {appliedPromo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                    <span>Discount ({appliedPromo.type === 'percentage' ? `${appliedPromo.value}%` : `Fixed`})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>₹{finalTotal}</span>
                </div>
              </div>
              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '1.25rem' }}
                onClick={handleCheckout}
              >
                Checkout Now
              </button>
            </motion.div>
          )}

          {currentTableOrders.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={16} /> Order Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentTableOrders.slice(0, 2).map(order => (
                  <div key={order.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>#{order.id.toString().slice(-4)}</span>
                      <span className={`badge badge-${order.status || 'pending'}`} style={{ fontSize: '0.6rem' }}>{order.status || 'pending'}</span>
                    </div>
                    <OrderProgressBar status={order.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {isPaymentModalOpen && (
        <PaymentModal 
          total={finalTotal} 
          cartTotal={cartTotal}
          discountAmount={discountAmount}
          promoInput={promoInput}
          setPromoInput={setPromoInput}
          handleApplyPromo={handleApplyPromo}
          promoError={promoError}
          appliedPromo={appliedPromo}
          setAppliedPromo={setAppliedPromo}
          onClose={() => setIsPaymentModalOpen(false)} 
          onSuccess={handlePaymentSuccess} 
        />
      )}
    </div>
  );
};

export default CustomerView;
