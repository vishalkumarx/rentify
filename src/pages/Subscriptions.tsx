import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Zap, Rocket, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStorageJson, setStorageJson } from '../lib/supabase';
import toast from 'react-hot-toast';
import styles from './Subscriptions.module.css';

const Subscriptions = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('Campus Basic');

  useEffect(() => {
    if (session?.user?.id) {
      getStorageJson(`profiles/${session.user.id}.json`).then(profile => {
        if (profile?.subscriptionPlan) {
          setCurrentPlan(profile.subscriptionPlan);
        }
      });
    }
  }, [session?.user?.id]);

  const handleSubscribe = async (planName: string) => {
    if (!session?.user?.id) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }
    
    try {
      const profile = await getStorageJson(`profiles/${session.user.id}.json`) || {};
      profile.subscriptionPlan = planName;
      profile.subscriptionDate = new Date().toISOString();
      await setStorageJson(`profiles/${session.user.id}.json`, profile);
      toast.success(`Successfully subscribed to ${planName}!`);
      navigate('/profile');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update subscription');
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto' }}>
      <div className={styles.container}>
        
        <div className={styles.headerContainer}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              width: '40px', 
              height: '40px', 
              padding: 0, 
              borderRadius: '20px', 
              background: 'var(--surface)', 
              border: '1px solid var(--surface-border)', 
              color: 'var(--text-main)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: 'var(--card-shadow)',
              cursor: 'pointer',
              position: 'absolute',
              left: '16px',
              top: '16px',
              zIndex: 10
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className={styles.pageTitle}>Choose Your Plan</h1>
          <p className={styles.pageDesc}>Unlock the full potential of your campus rentals</p>
        </div>

        <div className={styles.cardsWrapper}>
          
          {/* Basic Plan */}
          <div className={styles.card} style={{ position: 'relative', border: currentPlan === 'Campus Basic' ? '2px solid #000' : undefined }}>
            {currentPlan === 'Campus Basic' && (
              <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#000', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>CURRENT PLAN</div>
            )}
            <div className={styles.header}>
              <span className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Campus Basic</span>
              <span className={styles.price}>Free</span>
            </div>
            <p className={styles.desc}>Perfect for casual users who occasionally rent items.</p>
            <ul className={styles.lists}>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Up to 3 active listings</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Standard transaction fee (10%)</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>In-app messaging</span>
              </li>
            </ul>
            <button type="button" className={styles.action} onClick={() => currentPlan !== 'Campus Basic' && handleSubscribe('Campus Basic')} style={{ opacity: currentPlan === 'Campus Basic' ? 0.5 : 1, cursor: currentPlan === 'Campus Basic' ? 'default' : 'pointer' }}>
              {currentPlan === 'Campus Basic' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Plus Plan */}
          <div className={styles.card} style={{ position: 'relative', border: currentPlan === 'Campus Plus' ? '2px solid #000' : undefined }}>
            {currentPlan === 'Campus Plus' && (
              <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#000', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>CURRENT PLAN</div>
            )}
            <div className={styles.header}>
              <span className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={20} /> Campus Plus</span>
              <span className={styles.price}>₹49<span style={{ fontSize: '1.5rem' }}>/mo</span></span>
            </div>
            <p className={styles.desc}>For active users wanting better visibility & lower fees.</p>
            <ul className={styles.lists}>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Up to 10 active listings</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Reduced transaction fee (5%)</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>2 Free listing boosts/month</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Ad-free browsing</span>
              </li>
            </ul>
            <button type="button" className={styles.action} onClick={() => currentPlan !== 'Campus Plus' && handleSubscribe('Campus Plus')} style={{ opacity: currentPlan === 'Campus Plus' ? 0.5 : 1, cursor: currentPlan === 'Campus Plus' ? 'default' : 'pointer' }}>
              {currentPlan === 'Campus Plus' ? 'Current Plan' : 'Select Plus'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={styles.card} style={{ border: currentPlan === 'Campus Pro' ? '2px solid #000' : '2px solid var(--primary)', position: 'relative' }}>
            {currentPlan === 'Campus Pro' ? (
              <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#000', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>CURRENT PLAN</div>
            ) : (
              <div style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--primary)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>POPULAR</div>
            )}
            <div className={styles.header}>
              <span className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Rocket size={20} /> Campus Pro</span>
              <span className={styles.price}>₹99<span style={{ fontSize: '1.5rem' }}>/mo</span></span>
            </div>
            <p className={styles.desc}>For power renters and local campus entrepreneurs.</p>
            <ul className={styles.lists}>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Up to 20 active listings</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>0% transaction fee</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Premium search visibility</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Analytics dashboard</span>
              </li>
            </ul>
            <button type="button" className={styles.action} onClick={() => currentPlan !== 'Campus Pro' && handleSubscribe('Campus Pro')} style={{ opacity: currentPlan === 'Campus Pro' ? 0.5 : 1, cursor: currentPlan === 'Campus Pro' ? 'default' : 'pointer' }}>
              {currentPlan === 'Campus Pro' ? 'Current Plan' : 'Get Pro'}
            </button>
          </div>

          {/* Gold Plan */}
          <div className={styles.card} style={{ position: 'relative', border: currentPlan === 'Campus Gold' ? '2px solid #000' : undefined }}>
            {currentPlan === 'Campus Gold' && (
              <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#000', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>CURRENT PLAN</div>
            )}
            <div className={styles.header}>
              <span className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={20} /> Campus Gold</span>
              <span className={styles.price}>₹199<span style={{ fontSize: '1.5rem' }}>/mo</span></span>
            </div>
            <p className={styles.desc}>For elite renters looking for maximum reach and VIP support.</p>
            <ul className={styles.lists}>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unlimited active listings</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>0% transaction fee</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Always featured on Home page</span>
              </li>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Dedicated VIP support</span>
              </li>
            </ul>
            <button type="button" className={styles.action} onClick={() => currentPlan !== 'Campus Gold' && handleSubscribe('Campus Gold')} style={{ opacity: currentPlan === 'Campus Gold' ? 0.5 : 1, cursor: currentPlan === 'Campus Gold' ? 'default' : 'pointer' }}>
              {currentPlan === 'Campus Gold' ? 'Current Plan' : 'Go Gold'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
