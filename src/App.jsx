import React, { useState, useEffect } from 'react';
import { initialMenu } from './data';
import CustomerView from './components/CustomerView';
import OrderTrackingView from './components/OrderTrackingView';
import { Utensils, Moon, Sun, LogOut, LayoutGrid, ClipboardList, Download, RefreshCw, Info } from 'lucide-react';
import { db } from './firebase';
import { ref, push, set, onValue, update } from 'firebase/database';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import LoginView from './components/LoginView';
import { motion, AnimatePresence } from 'framer-motion';
import { sendWelcomeEmail } from './utils/email';

function App() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'orders'
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('table') || '';
  });
  const [menu, setMenu] = useState(initialMenu);
  const [theme, setTheme] = useState(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [hasSentWelcomeEmail, setHasSentWelcomeEmail] = useState(false);
  const [showUpdateReady, setShowUpdateReady] = useState(false);
  const APP_VERSION = '2.0.2';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleUpdateAvailable = () => setShowUpdateReady(true);
    window.addEventListener('swUpdateAvailable', handleUpdateAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('swUpdateAvailable', handleUpdateAvailable);
    };
  }, []);

  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const dishesRef = ref(db, 'dishes');
    const unsubscribeMenu = onValue(dishesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dishesData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMenu(dishesData);
      }
    });

    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let dbOrders = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        dbOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setOrders(dbOrders);
      }
    });

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && tableNumber && !hasSentWelcomeEmail) {
      sendWelcomeEmail(user, tableNumber);
      setHasSentWelcomeEmail(true);
    }
    if (!user) {
      setHasSentWelcomeEmail(false);
    }
  }, [user, tableNumber, hasSentWelcomeEmail]);

  const handlePlaceOrder = async (paymentDetails) => {
    if (cart.length === 0 || !tableNumber || !user) return;

    try {
      const newOrderRef = push(ref(db, 'orders'));
      await set(newOrderRef, {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        table_number: tableNumber,
        items: cart.map(item => ({ name: item.name, price: item.price, quantity: item.quantity, ...(item.portion ? { portion: item.portion } : {}) })),
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount: paymentDetails.discount || 0,
        promoCode: paymentDetails.promoCode || null,
        total_amount: paymentDetails.finalTotal || cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        payment_method: paymentDetails.method || "Online",
        orderType: paymentDetails.orderType || 'dine-in',
        timestamp: new Date().toISOString()
      });
      setCart([]);
      setActiveTab('orders');
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const feedbackRef = push(ref(db, 'feedback'));
      await set(feedbackRef, feedbackData);
      
      // Update order to mark it as rated
      if (feedbackData.orderId) {
        const orderRef = ref(db, `orders/${feedbackData.orderId}`);
        await update(orderRef, { hasFeedback: true });
      }
    } catch (e) {
      console.error("Error submitting feedback: ", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTableNumber('');
      setCart([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!authInitialized) {
    return (
      <div className="app-container">
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Utensils size={48} color="var(--accent-primary)" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user || !tableNumber) {
    return (
      <div className="app-container">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Utensils size={32} color="var(--accent-primary)" />
            <h1 style={{ margin: 0 }}>FlavorFusion</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick} 
                className="btn-primary" 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
              >
                <Download size={16} />
                <span className="hide-mobile">Install App</span>
              </button>
            )}
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              className="btn-outline" 
              style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>
        <LoginView onLogin={(tNum, loggedUser) => {
          setTableNumber(tNum);
          setUser(loggedUser);
        }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Utensils size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0 }}>FlavorFusion</h1>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutGrid size={18} />
              <span>Menu</span>
            </div>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} />
              <span>Orders</span>
            </div>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick} 
              className="btn-primary" 
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              <Download size={16} />
              <span className="hide-mobile">Install App</span>
            </button>
          )}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="btn-outline" 
            style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="btn-outline" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={18} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'menu' && (
              <CustomerView 
                menu={menu}
                cart={cart}
                setCart={setCart}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                onPlaceOrder={handlePlaceOrder}
                orders={orders}
                user={user}
              />
            )}
            {activeTab === 'orders' && (
              <OrderTrackingView 
                orders={orders} 
                currentTableNumber={tableNumber} 
                onSwitchTab={setActiveTab}
                user={user}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer style={{ 
        padding: '2rem 1rem', 
        textAlign: 'center', 
        opacity: 0.6, 
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border-color)',
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Utensils size={14} />
          <span>FlavorFusion Premium &copy; 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '12px' }}>
          <Info size={12} />
          <span>Version {APP_VERSION}</span>
        </div>
      </footer>

      {/* Version Update Notification */}
      <AnimatePresence>
        {showUpdateReady && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{ 
              position: 'fixed', 
              bottom: '2rem', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 1000,
              width: 'min(90%, 400px)'
            }}
          >
            <div style={{ 
              background: 'var(--accent-primary)', 
              color: 'white', 
              padding: '1rem 1.5rem', 
              borderRadius: '16px', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCw size={20} className="animate-spin-slow" />
                <div>
                  <div style={{ fontWeight: '600' }}>Update Available</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>New version is ready to install</div>
                </div>
              </div>
              <button 
                onClick={handleUpdateApp}
                style={{ 
                  background: 'white', 
                  color: 'var(--accent-primary)', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Update Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default App;
