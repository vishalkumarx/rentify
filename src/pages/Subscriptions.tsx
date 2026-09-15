import { useNavigate } from 'react-router-dom';
import styles from './Subscriptions.module.css';

const Subscriptions = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto' }}>
      <div className={styles.container}>
        
        <div className={styles.headerContainer}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-main)',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              position: 'absolute',
              left: '16px',
              top: '16px'
            }}
          >
            ←
          </button>
          <h1 className={styles.pageTitle}>Choose Your Plan</h1>
          <p className={styles.pageDesc}>Unlock the full potential of your campus rentals</p>
        </div>

        <div className={styles.cardsWrapper}>
          
          {/* Basic Plan */}
          <div className={styles.card}>
            <div className={styles.header}>
              <span className={styles.title}>Campus Basic</span>
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
            <button type="button" className={styles.action}>
              Current Plan
            </button>
          </div>

          {/* Plus Plan */}
          <div className={styles.card} style={{ border: '2px solid var(--primary)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--primary)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>POPULAR</div>
            <div className={styles.header}>
              <span className={styles.title}>Campus Plus</span>
              <span className={styles.price}>$4<span style={{ fontSize: '1.5rem' }}>/mo</span></span>
            </div>
            <p className={styles.desc}>For active users wanting better visibility & lower fees.</p>
            <ul className={styles.lists}>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Up to 15 active listings</span>
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
            <button type="button" className={styles.action}>
              Upgrade Now
            </button>
          </div>

          {/* Pro Plan */}
          <div className={styles.card}>
            <div className={styles.header}>
              <span className={styles.title}>Campus Pro</span>
              <span className={styles.price}>$12<span style={{ fontSize: '1.5rem' }}>/mo</span></span>
            </div>
            <p className={styles.desc}>For power renters and local campus entrepreneurs.</p>
            <ul className={styles.lists}>
              <li className={styles.list}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unlimited listings</span>
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
            <button type="button" className={styles.action}>
              Get Pro
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
