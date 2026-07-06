import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, Heart, Flame, ArrowRight, ChevronRight, Building2, Clock, X, Star, Coffee } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useSEO } from '../hooks/useSEO';
import { getStorageJson, setStorageJson } from '../lib/supabase';
import toast from 'react-hot-toast';

// @ts-ignore
import imgBooks from '../assets/books and stationary.PNG';
// @ts-ignore
import imgClothing from '../assets/clothings and lab wears.PNG';
// @ts-ignore
import imgElectronics from '../assets/electronics.PNG';
// @ts-ignore
import imgMobility from '../assets/mobility.PNG';
// @ts-ignore
import imgSports from '../assets/sports.PNG';
// @ts-ignore
import imgTools from '../assets/tools and hardware.PNG';
// @ts-ignore
import mobileBanner from '../assets/mobile banner.PNG';
// @ts-ignore
import imgDorm from '../assets/dorm essentials.PNG';
// @ts-ignore
import imgParty from '../assets/party supplies.PNG';
// @ts-ignore
import imgPhotography from '../assets/photography.PNG';
// @ts-ignore
import imgGaming from '../assets/gaming.PNG';
// @ts-ignore
import imgMusic from '../assets/usical instruments.PNG';
// @ts-ignore
import imgOthers from '../assets/others.PNG';

const visualCategories = [
  { id: 'Books and Stationary', title: 'Books and Stationary', img: imgBooks },
  { id: 'Clothing & Formalwear', title: 'Clothing & Formalwear', img: imgClothing },
  { id: 'Electronics', title: 'Electronics', img: imgElectronics },
  { id: 'Mobility', title: 'Mobility', img: imgMobility },
  { id: 'Sports Gear', title: 'Sports Gear', img: imgSports },
  { id: 'Tools & Hardware', title: 'Tools & Hardware', img: imgTools },
  { id: 'Dorm Essentials', title: 'Dorm Essentials', img: imgDorm },
  { id: 'Party Supplies', title: 'Party Supplies', img: imgParty },
  { id: 'Photography', title: 'Photography', img: imgPhotography },
  { id: 'Gaming', title: 'Gaming', img: imgGaming },
  { id: 'Music Instruments', title: 'Music Instruments', img: imgMusic },
  { id: 'Others', title: 'Others', img: imgOthers }
];

const PROMOS = [
  { title: "Campus Commute", subtitle: "Rent e-scooters from ₹50/day", badge: "Mobility", url: "https://images.unsplash.com/photo-1778735790178-f2d243a914d9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Zone out. Study in.", subtitle: "Premium noise-cancelling gear", badge: "Electronics", url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Finals Week Deals", subtitle: "Up to 40% off study essentials", badge: "Hot", url: "https://images.unsplash.com/photo-1620287920810-3f5b9746380c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Weekend Trip?", subtitle: "Tents & outdoor gear for rent", badge: "Sports", url: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

export default function Home() {
  useSEO('Home');
  const { session, profile, updateProfile } = useAuth();
  const { requests } = useBookings();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [tRating, setTRating] = useState(5);
  const [tReview, setTReview] = useState('');
  const [tName, setTName] = useState('');
  const [tYear, setTYear] = useState('1st Year');
  const [tDept, setTDept] = useState(DEPARTMENTS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  useEffect(() => {
    getStorageJson('admin/testimonials.json').then(data => {
      if (data && Array.isArray(data)) {
        setTestimonials(data.filter(t => t.status === 'approved'));
      }
    });
  }, []);

  useEffect(() => {
    if (profile) {
      setTName(profile.name || '');
      if (profile.department) setTDept(profile.department);
    }
  }, [profile]);

  const handleSubmitTestimonial = async () => {
    if (!tName || !tReview) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    const data = await getStorageJson('admin/testimonials.json') || [];
    data.push({
      id: Date.now().toString(),
      userId: session?.user?.id || 'anonymous',
      name: tName,
      year: tYear,
      department: tDept,
      rating: tRating,
      review: tReview,
      status: 'pending',
      date: new Date().toISOString()
    });
    await setStorageJson('admin/testimonials.json', data);
    setIsSubmitting(false);
    setShowTestimonialModal(false);
    toast.success('Testimonial submitted for review!');
    setTReview('');
  };

  const firstName = profile?.name?.split(" ")[0] || session?.user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const userDepartment = profile?.department || "Choose your department";

  // Animated Placeholder
  const phrases = [
    "Search for Books...",
    "Search for Electronics...",
    "Search for Furniture...",
    "Search for Bicycles...",
    "Search for Notes..."
  ];
  const [placeholderText, setPlaceholderText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
      if (placeholderText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length - 1));
        }, 30);
      }
    } else {
      if (placeholderText === currentPhrase) {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length + 1));
        }, 80);
      }
    }
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, phraseIndex]);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'price-asc', 'price-desc'
  const [displayCount, setDisplayCount] = useState(12);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDepartment, setActiveDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredOffset, setFeaturedOffset] = useState(0);

  useEffect(() => {
    const updateFeaturedOffset = () => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const dayIndex = Math.floor(Date.now() / msPerDay);
      setFeaturedOffset(dayIndex * 3);
    };
    updateFeaturedOffset();
    const interval = setInterval(updateFeaturedOffset, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => prev + 12);
        }
      },
      { rootMargin: '200px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []);

  const { items, toggleLike, loading } = useFeed();
  const navigate = useNavigate();


  // Filter items based on active category, search
  const filteredItems = items
    .filter(item => {
      // Hide posts made by the logged-in user
      if (session?.user?.id && item.userId === session.user.id) {
        return false;
      }
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesDepartment = activeDepartment === 'All' || item.department === activeDepartment;
      return matchesCategory && matchesDepartment;
    })
    .sort((a, b) => {
      if (sortOrder === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortOrder === 'price-desc') return Number(b.price) - Number(a.price);
      return b.id - a.id; // 'newest' (assuming higher ID is newer)
    });

  // Separate search logic for dropdown
  const searchLower = searchQuery.toLowerCase().trim();
  const searchResults = searchLower ? items.filter(item => {
    // Hide posts made by the logged-in user
    if (session?.user?.id && item.userId === session.user.id) return false;
    return (item.title && item.title.toLowerCase().includes(searchLower)) ||
           (item.description && item.description.toLowerCase().includes(searchLower)) ||
           (item.category && item.category.toLowerCase().includes(searchLower));
  }) : [];

  const renderItemCard = (item: any, index: number, isFeatured: boolean) => (
    <div 
      key={item.id} 
      onClick={() => navigate(`/item/${item.id}`)}
      className="animate-slide-in" 
      style={{ 
        gridColumn: 'span 1',
        background: 'var(--surface)', 
        borderRadius: '0', 
        border: isFeatured ? '2px solid var(--success)' : '1px solid var(--surface-border)', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        animationDelay: `${index * 0.05}s`, 
        cursor: 'pointer',
        boxShadow: isFeatured ? '0 8px 30px rgba(34, 197, 94, 0.15)' : 'none'
      }}
    >
      <div style={{ position: 'relative', height: '200px' }}>
        {isFeatured && (
          <div style={{ position: 'absolute', top: '-1px', right: '16px', background: 'var(--success)', color: '#fff', padding: '6px 12px', borderRadius: '0 0 12px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', zIndex: 10, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
            FEATURED
          </div>
        )}
        <img 
          src={item.image} 
          alt={item.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: item.status === 'booked' ? 0.5 : 1 }}
        />
        
        {/* Status Overlays */}
        {(() => {
          const userAcceptedReq = session ? requests.find(r => r.item_id === item.id && r.requester_id === session.user.id && r.status === 'accepted') : null;
          if (userAcceptedReq) {
            return (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--success)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                RENTED BY YOU
              </div>
            );
          }
          if (item.status === 'booked') {
            return (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: '1px solid var(--surface-border)' }}>
                UNAVAILABLE
              </div>
            );
          }
          return null;
        })()}

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!session) navigate('/login'); else toggleLike(item.id); 
          }}
          style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', padding: 0, borderRadius: '16px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.liked ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          <Heart size={16} fill={item.liked ? 'var(--danger)' : 'none'} />
        </button>
      </div>

      {/* Text Container Below Image */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--primary-glow)', color: '#000', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' }}>
            {item.category}
          </span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%' }}>{item.title}</h3>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--success)' }}>
            ₹{item.price}<span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>/day</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, minWidth: 0, flex: 1 }}>
            <Building2 size={14} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.department?.startsWith('lat:') ? DEPARTMENTS[(item.id % (DEPARTMENTS.length - 1)) + 1] : item.department}
            </span>
          </p>
          
          {item.itemRating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--warning)', fontWeight: 700, flexShrink: 0 }}>
              ⭐ {item.itemRating} ({item.itemReviewCount || 0})
            </div>
          )}
        </div>
        
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
          {item.description || 'No description available for this item. Contact the seller for more details.'}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Department Chooser */}
      <div style={{ background: 'var(--bg)', padding: '16px', display: 'flex' }}>
        <div onClick={() => setShowDepartmentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', cursor: 'pointer', background: 'var(--surface)', padding: '8px 12px', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Building2 size={16} />
          <span style={{ fontSize: '14px', fontWeight: 700 }}>{userDepartment}</span>
        </div>
      </div>

      {/* Greeting & Search (Scrolls with page) */}
      <div style={{ padding: '8px 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg)' }}>
        
        {/* Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Hey {firstName} 👋</p>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>What do you need today?</h1>
        </div>

        {/* Search & Filter */}
        <div style={{ position: 'relative', width: '50%', minWidth: '280px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '12px 16px', gap: '12px', transition: 'all 0.2s' }}>
              <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder={placeholderText || "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', width: '100%', outline: 'none', color: 'var(--text-main)' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', width: 'auto', flexShrink: 0 }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(true)}
              style={{ position: 'relative', width: '48px', height: '48px', padding: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sortOrder !== 'newest' ? 'var(--primary)' : 'var(--surface)', color: sortOrder !== 'newest' ? '#000' : 'var(--text-main)', border: sortOrder !== 'newest' ? 'none' : '1px solid var(--surface-border)' }}
            >
              <SlidersHorizontal size={20} />
              {(sortOrder !== 'newest' || activeCategory !== 'All' || activeDepartment !== 'All') && (
                <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--primary)' }}></span>
              )}
            </button>
          </div>
          
          {searchQuery && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: '56px', marginTop: '8px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div key={item.id} onClick={() => navigate(`/item/${item.id}`)} style={{ padding: '12px 16px', borderBottom: idx < searchResults.length - 1 ? '1px solid var(--surface-border)' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <img src={item.image || 'https://via.placeholder.com/40'} alt={item.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{item.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{item.price}/day</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Layout */}
      <div className="home-layout">
        
        {/* Desktop Sidebar (Removed to favor visual grid) */}
        <div className="desktop-categories" style={{ display: 'none' }}></div>

        {/* Main Scroll Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Promo Carousel */}
        <div style={{ width: '100%', overflow: 'hidden', marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '1400px' }}>
            <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 16px 8px', gap: '16px' }}>
              {PROMOS.slice(0, 4).map((p, i) => (
              <div onClick={() => navigate('/coming-soon')} key={i} className="promo-card" style={{ cursor: 'pointer', height: '180px', borderRadius: '24px', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'center', flexShrink: 0, border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                <img src={p.url} alt={p.title} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4), transparent)' }} />
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', color: '#fff' }}>
                  <span style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'var(--primary)', color: '#000', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', borderRadius: '20px', letterSpacing: '1px' }}>{p.badge}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px', lineHeight: 1.1 }}>{p.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{p.subtitle}</p>
                    <ArrowRight size={20} className="text-volt" />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Visual Categories Grid */}
        <div style={{ padding: '16px', width: '100%', display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Popular Categories</h2>
            <div style={{ flex: 1 }}></div>
          </div>
          <div className="categories-grid">
            {visualCategories.slice(0, 6).map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/category/${encodeURIComponent(cat.title)}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  border: '1px solid var(--surface-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}>
                  <img src={cat.img} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span className="cat-text animate-reveal" style={{ fontWeight: 700, color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.2, animationDelay: `${idx * 0.1}s` }}>
                  <span className="animate-typewriter" style={{ animationDelay: `${idx * 0.6}s` }}>{cat.title}</span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', width: '100%' }}>
            <button 
              onClick={() => navigate('/categories')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--surface-border)', border: 'none', color: 'var(--text-main)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: '12px 20px', borderRadius: '24px', width: 'calc(100% - 32px)', maxWidth: '300px', margin: '0 16px' }}
            >
              See All Categories <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Item Requests Banner */}
        <div style={{ padding: '0 16px 24px', margin: '0 auto', width: '100%', maxWidth: '800px' }}>
          <button
            onClick={() => navigate('/item-requests')}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, var(--surface) 0%, rgba(244,196,48,0.1) 100%)', 
              border: '1px solid var(--surface-border)', 
              borderRadius: '24px', 
              padding: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Can't find what you need?</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Request an item from the community feed!</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronRight size={20} />
            </div>
          </button>
        </div>


        {loading ? (
          <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
            <div className="skeleton" style={{ gridColumn: 'span 2', height: '240px', borderRadius: '24px' }}></div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4/3', borderRadius: '24px' }}></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '32px 16px' }}>
            <div style={{ background: 'rgba(244, 196, 48, 0.1)', border: '2px dashed var(--primary)', borderRadius: '24px', padding: '24px', margin: '0 auto', maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>🌱 Our community is growing!</h3>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.5 }}>
                Even if you don't find what you are looking for today, consider listing your unused items so others don't go empty handed.
              </p>
            </div>
          </div>
        ) : (
          (() => {
            const featuredCount = 3;
            const safeOffset = filteredItems.length > 0 ? featuredOffset % filteredItems.length : 0;
            const featuredItems: typeof filteredItems = [];
            for (let i = 0; i < featuredCount; i++) {
              if (filteredItems.length > 0) {
                featuredItems.push(filteredItems[(safeOffset + i) % filteredItems.length]);
              }
            }
            // Keep recently added items stable by using a static slice
            const normalItems = filteredItems.slice(featuredCount, displayCount);
            
            return (
              <>
                {featuredItems.length > 0 && (
                  <>
                    <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
                        <Flame size={20} className="text-volt" /> Featured
                      </h2>
                    </div>
                    <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
                      {featuredItems.map((item, index) => renderItemCard(item, index, true))}
                    </div>
                  </>
                )}

                {normalItems.length > 0 && (
                  <>
                    <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
                        <Clock size={20} className="text-volt" /> Recently Added
                      </h2>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {Math.min(filteredItems.length - featuredCount, displayCount - featuredCount)} items
                      </span>
                    </div>
                    <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
                      {normalItems.map((item, index) => renderItemCard(item, index, false))}
                    </div>
                  </>
                )}
              </>
            );
          })()
        )}


        {/* Community Message (Always at bottom) */}
        <div style={{ background: 'rgba(244, 196, 48, 0.1)', border: '2px dashed var(--primary)', borderRadius: '24px', padding: '24px', margin: '16px auto 32px', maxWidth: '400px', width: 'calc(100% - 32px)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>🌱 Our community is growing!</h3>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.5 }}>
            Even if you don't find what you are looking for today, consider listing your unused items so others don't go empty handed.
          </p>
        </div>

        {/* Testimonial Section */}
        <div style={{ margin: '0 auto 32px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>What Students Say</h3>
            <button 
              onClick={() => setShowTestimonialModal(true)}
              style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, width: 'fit-content' }}
            >
              Write a Review
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '0 24px 8px 24px' }} className="hide-scrollbar">
            {testimonials.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', width: '100%', background: 'var(--surface)', borderRadius: '24px' }}>
                No testimonials yet. Be the first to share your experience!
              </div>
            ) : (
              testimonials.map((t, i) => (
                <div key={i} className="glass-panel" style={{ minWidth: '280px', maxWidth: '300px', padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={16} fill={idx < t.rating ? "var(--warning)" : "transparent"} color={idx < t.rating ? "var(--warning)" : "var(--surface-border)"} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5, flex: 1 }}>
                    "{t.review}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{t.name}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.department}, {t.year}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Load More Trigger */}
        {filteredItems.length > displayCount && (
          <div ref={loadMoreRef} style={{ height: '40px', width: '100%' }} />
        )}
        
        {/* Black Footer */}
        <footer style={{ padding: '40px 24px', marginTop: 'auto', background: '#000', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#fff', textAlign: 'center' }}>
              Join thousands of students saving more together!
            </h3>

            <div className="desktop-only" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => navigate('/coming-soon')} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}>About the App</button>
              <button onClick={() => navigate('/how-it-works')} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}>How it Works</button>
              <button onClick={() => navigate('/safety-guidelines')} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}>Safety Guidelines</button>
            </div>
            
            <button 
              className="desktop-only"
              onClick={() => window.open('https://www.buymeacoffee.com/', '_blank')} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#FFDD00', fontSize: '15px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}
            >
              <Coffee size={20} /> Buy Me a Coffee
            </button>
            
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              &copy; {new Date().getFullYear()} CampusRent. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Filter Modal */}
      {showFilters && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ position: 'relative', width: '100%', maxWidth: '360px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Filters</h2>
              <button 
                onClick={() => setShowFilters(false)}
                style={{ width: '36px', height: '36px', padding: 0, background: 'rgba(0,0,0,0.05)', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
              <select 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{ padding: '12px 16px', borderRadius: '16px', fontSize: '15px', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', outline: 'none', appearance: 'auto' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-muted)' }}>Department</label>
              <select 
                value={activeDepartment} 
                onChange={(e) => setActiveDepartment(e.target.value)}
                style={{ padding: '12px 16px', borderRadius: '16px', fontSize: '15px', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', outline: 'none', appearance: 'auto' }}
              >
                <option value="All">All</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-muted)' }}>Sort By</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'newest', label: 'Newest First' },
                  { id: 'price-asc', label: 'Price: Low to High' },
                  { id: 'price-desc', label: 'Price: High to Low' }
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSortOrder(s.id)} 
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', background: sortOrder === s.id ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: sortOrder === s.id ? '#000' : 'var(--text-main)', border: sortOrder === s.id ? 'none' : '1px solid var(--surface-border)' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => { setActiveCategory('All'); setActiveDepartment('All'); setSortOrder('newest'); }} 
                style={{ flex: 1, padding: '16px', borderRadius: '20px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', fontWeight: 700, fontSize: '15px', border: 'none' }}
              >
                Clear
              </button>
              <button 
                onClick={() => setShowFilters(false)} 
                className="glow" 
                style={{ flex: 2, padding: '16px', borderRadius: '20px', background: 'var(--primary)', color: '#000', fontWeight: 800, fontSize: '16px', border: 'none' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Department Picker Modal */}
      {showDepartmentModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', maxWidth: '360px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Choose Department</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => {
                    updateProfile({ department: dept });
                    setShowDepartmentModal(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    textAlign: 'left',
                    background: userDepartment === dept ? 'var(--primary)' : 'var(--surface)',
                    color: userDepartment === dept ? '#000' : 'var(--text-main)',
                    border: userDepartment === dept ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                    fontWeight: userDepartment === dept ? 700 : 500,
                    fontSize: '15px'
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDepartmentModal(false)} style={{ padding: '14px', borderRadius: '20px', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 700, fontSize: '15px', border: 'none' }}>
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Testimonial Modal */}
      {showTestimonialModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Write a Review</h2>
              <button onClick={() => setShowTestimonialModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0, margin: 0, display: 'flex', width: 'auto' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1,2,3,4,5].map(i => (
                  <Star 
                    key={i} 
                    size={32} 
                    fill={i <= tRating ? "var(--warning)" : "transparent"} 
                    color={i <= tRating ? "var(--warning)" : "var(--surface-border)"} 
                    onClick={() => setTRating(i)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  />
                ))}
              </div>
              
              <input type="text" placeholder="Your Name" value={tName} onChange={e => setTName(e.target.value)} style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select value={tYear} onChange={e => setTYear(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', appearance: 'auto' }}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={tDept} onChange={e => setTDept(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', appearance: 'auto' }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <textarea placeholder="Tell us about your experience..." value={tReview} onChange={e => setTReview(e.target.value)} rows={4} style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', resize: 'none', fontFamily: 'inherit' }} />
              
              <button 
                onClick={handleSubmitTestimonial}
                disabled={isSubmitting}
                style={{ padding: '16px', borderRadius: '20px', background: 'var(--primary)', color: '#000', fontWeight: 800, fontSize: '16px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </div>
  );
}
