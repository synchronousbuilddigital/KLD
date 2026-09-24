import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, Tag, CreditCard, ShieldCheck, X, Check, Gift, Clock } from 'lucide-react';
import BackgroundCanvas from '../components/layout/BackgroundCanvas';
import '../../styles/new-home.css';

import Header from '../components/layout/Header';

import { API_BASE_URL } from '../../config/api';

interface PricingPageProps {
  onBack?: () => void;
  onNavigate?: (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => void;
}

export default function PricingPage({ onBack, onNavigate }: PricingPageProps) {
  const [isYearly, setIsYearly] = useState(false);

  // Live Plan Config State
  const [planConfig, setPlanConfig] = useState({
    basePriceMonthly: 1000,
    basePriceYearly: 600,
    baseAiCredits: 300,
    baseTitle: 'Base Plan',
    baseDescription: 'Essential tools for beginners.',
    baseFeatures: [] as { text: string; included: boolean; info?: boolean }[],
    baseAiFeatures: [] as { text: string; included: boolean; info?: boolean }[],
    proPriceMonthly: 10000,
    proPriceYearly: 6000,
    proAiCredits: 10000,
    proTitle: 'Pro Plan',
    proDescription: 'Advanced features for serious creators and professionals.',
    proFeatures: [] as { text: string; included: boolean; info?: boolean }[],
    proAiFeatures: [] as { text: string; included: boolean; info?: boolean }[],
    yearlyDiscountPercent: 40,
    promotion: {
      active: false,
      title: 'Festival Sale',
      description: 'Save 40% on all plans!',
      discountPercent: 40,
      startsAt: null as string | null,
      endsAt: null as string | null,
      isExpired: false
    }
  });

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; flatDiscountINR: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  // Checkout Payment Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'BASE' | 'PRO'>('PRO');

  const handleNav = (view: 'landing' | 'models' | 'dielines' | 'pricing' | 'about' | 'profile' | 'workspace') => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.dispatchEvent(new CustomEvent('navigate', { detail: view }));
    }
  };

  useEffect(() => {
    const fetchLiveConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/plans`);
        const data = await res.json();
        if (data.success && data.data) {
          setPlanConfig(data.data);
        }
      } catch (e) {
        console.error('Failed to load live plan prices', e);
      }
    };
    fetchLiveConfig();

    document.body.style.zoom = '1';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.body.style.zoom = '';
      document.body.style.width = '';
    };
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    try {
      setIsCheckingCoupon(true);
      setCouponMsg(null);
      const res = await fetch(`${API_BASE_URL}/plans/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAppliedCoupon(data.data);
        setCouponMsg({ 
          type: 'success', 
          text: `Coupon "${data.data.code}" applied! ${data.data.discountPercent ? `${data.data.discountPercent}% discount` : `₹${data.data.flatDiscountINR} OFF`} unlocked.` 
        });
      } else {
        setAppliedCoupon(null);
        setCouponMsg({ type: 'error', text: data.message || 'Invalid coupon code.' });
      }
    } catch {
      setCouponMsg({ type: 'error', text: 'Failed to validate coupon.' });
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleOpenCheckout = (plan: 'BASE' | 'PRO') => {
    setCheckoutPlan(plan);
    setCouponCodeInput('');
    setAppliedCoupon(null);
    setCouponMsg(null);
    setCheckoutModalOpen(true);
  };

  // Dynamic Price Calculations
  const rawBasePrice = isYearly ? planConfig.basePriceYearly : planConfig.basePriceMonthly;
  const rawProPrice = isYearly ? planConfig.proPriceYearly : planConfig.proPriceMonthly;

  const activeRawPrice = checkoutPlan === 'BASE' ? rawBasePrice : rawProPrice;
  let activeFinalPrice = activeRawPrice;

  if (appliedCoupon) {
    if (appliedCoupon.discountPercent > 0) {
      activeFinalPrice = Math.round(activeRawPrice * (1 - appliedCoupon.discountPercent / 100));
    } else if (appliedCoupon.flatDiscountINR > 0) {
      activeFinalPrice = Math.max(0, activeRawPrice - appliedCoupon.flatDiscountINR);
    }
  }

  const baseFeatures = planConfig.baseFeatures && planConfig.baseFeatures.length > 0 ? planConfig.baseFeatures : [
    { text: "Remove all watermarks", included: true },
    { text: "Export dieline templates: not supported", included: false },
    { text: "Maximum export of 2K rendered images", included: true },
    { text: "Maximum export of 720p rendered videos", included: true },
    { text: "Maximum export of 2K AI background images", included: true },
    { text: "For personal use only", included: true, info: true },
  ];

  const baseAiFeatures = planConfig.baseAiFeatures && planConfig.baseAiFeatures.length > 0 ? planConfig.baseAiFeatures : [
    { text: `${planConfig.baseAiCredits.toLocaleString()} AI credits, updated monthly`, included: true },
    { text: "Access to AI Design, AI Creation, AI Video, AI Background and AI Logo features.", included: true },
  ];

  const proFeatures = planConfig.proFeatures && planConfig.proFeatures.length > 0 ? planConfig.proFeatures : [
    { text: "Maximum export of 8K rendered images", included: true },
    { text: "Maximum export of 2K rendered videos", included: true },
    { text: "Advanced features of the dieline templates", included: true },
    { text: "Commercial use and resale license", included: true, info: true },
  ];

  const proAiFeatures = planConfig.proAiFeatures && planConfig.proAiFeatures.length > 0 ? planConfig.proAiFeatures : [
    { text: `${planConfig.proAiCredits.toLocaleString()} AI credits, updated monthly`, included: true },
    { text: "Access to AI Design, AI Creation, AI Video, AI Background and AI Logo features.", included: true },
  ];

  return (
    <div className="new-home-landing min-h-screen font-sans flex flex-col relative z-0" style={{ backgroundColor: '#ffffff' }}>
      <BackgroundCanvas position="fixed" zIndex={0} />
      
      <Header activeNav="pricing" onNavigate={handleNav} />

      {planConfig.promotion && planConfig.promotion.active && !planConfig.promotion.isExpired && (
        <div 
          className="w-full overflow-hidden bg-amber-500/15 border-b border-amber-500/30 text-zinc-900 py-4 min-h-[54px] flex items-center relative z-20 group backdrop-blur-md shadow-sm"
          style={{ marginTop: '88px' }}
        >
          <style>{`
            @keyframes promoTickerEdge {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .promo-ticker-edge-track {
              display: flex;
              align-items: center;
              width: max-content;
              animation: promoTickerEdge 22s linear infinite;
            }
            .group:hover .promo-ticker-edge-track {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="promo-ticker-edge-track flex items-center">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="flex items-center gap-6 px-6 text-sm font-bold tracking-wide whitespace-nowrap">
                <span className="flex items-center gap-2 text-amber-950 font-black text-base">
                  <Gift className="w-4 h-4 text-amber-950 shrink-0" /> {planConfig.promotion.title}
                </span>
                <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase shadow-sm">
                  -{planConfig.promotion.discountPercent}% OFF
                </span>
                <span className="text-zinc-900 font-semibold">{planConfig.promotion.description}</span>
                {planConfig.promotion.endsAt && (
                  <span className="text-amber-950 font-mono text-xs bg-amber-200/80 px-3 py-1 rounded-md font-extrabold border border-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-950 shrink-0" /> Expires: {new Date(planConfig.promotion.endsAt).toLocaleDateString()}
                  </span>
                )}
                <span className="text-amber-500 font-bold ml-2">•</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main 
        className="flex-1 flex flex-col items-center px-4 sm:px-6 relative z-10" 
        style={{ paddingTop: (planConfig.promotion && planConfig.promotion.active && !planConfig.promotion.isExpired) ? '24px' : '96px', paddingBottom: '60px' }}
      >

        <div className="mb-8 sm:mb-12 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-full p-1.5 flex shadow-sm relative w-[280px]">
            <motion.div 
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[130px] bg-zinc-900 rounded-full shadow-md pointer-events-none"
              animate={{ x: isYearly ? 134 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button 
              onClick={() => setIsYearly(false)}
              className={`flex-1 relative z-10 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 ${!isYearly ? 'text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsYearly(true)}
              className={`flex-1 relative z-10 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${isYearly ? 'text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Yearly
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${isYearly ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>-{planConfig.yearlyDiscountPercent}%</span>
            </button>
          </div>
        </div>

        <div className="max-w-[1000px] w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-zinc-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col h-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">{planConfig.baseTitle}</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8">{planConfig.baseDescription}</p>
            
            <div className="mb-6 sm:mb-8 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-zinc-900">₹{rawBasePrice.toLocaleString('en-IN')}</span>
              <span className="text-zinc-500 ml-2 text-sm sm:text-base">/month</span>
            </div>
            {isYearly && <div className="text-xs sm:text-sm text-zinc-400 mb-6 -mt-4 sm:-mt-6">Billed ₹{(rawBasePrice * 12).toLocaleString('en-IN')} annually</div>}

            <button 
              onClick={() => handleOpenCheckout('BASE')}
              className="w-full py-3.5 sm:py-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold rounded-xl transition-colors mb-8 sm:mb-10 text-sm"
            >
              Get Base Plan
            </button>

            <div className="flex-1">
              <h4 className="font-semibold text-lg text-zinc-900 mb-4">Key features</h4>
              <ul className="space-y-4 mb-8">
                {baseFeatures.map((feat, i) => (
                  <li key={i} className={`flex items-start gap-3 ${!feat.included ? 'text-zinc-400' : 'text-zinc-700'}`}>
                    {feat.included ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-zinc-300 shrink-0" />}
                    <span className="text-sm leading-tight flex items-center gap-1.5">
                      {feat.text}
                      {feat.info && <Info className="w-3.5 h-3.5 text-zinc-400" />}
                    </span>
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-lg text-zinc-900 mb-4">AI features</h4>
              <ul className="space-y-4">
                {baseAiFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm leading-tight">{feat.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-indigo-500 shadow-[0_30px_60px_-15px_rgba(99,102,241,0.15)] flex flex-col h-full relative"
          >
            <div className="absolute inset-0 overflow-hidden rounded-[calc(1.5rem-2px)] pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            <div className="absolute top-0 right-6 sm:right-10 transform -translate-y-1/2 z-10">
              <div className="bg-indigo-500 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                ✦ Commercial Use
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">{planConfig.proTitle}</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8">{planConfig.proDescription}</p>
            
            <div className="mb-6 sm:mb-8 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-zinc-900">₹{rawProPrice.toLocaleString('en-IN')}</span>
              <span className="text-zinc-500 ml-2 text-sm sm:text-base">/month</span>
            </div>
            {isYearly && <div className="text-xs sm:text-sm text-zinc-400 mb-6 -mt-4 sm:-mt-6">Billed ₹{(rawProPrice * 12).toLocaleString('en-IN')} annually</div>}

            <button 
              onClick={() => handleOpenCheckout('PRO')}
              className="w-full py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors mb-8 sm:mb-10 shadow-lg shadow-indigo-200 text-sm"
            >
              Upgrade to Pro
            </button>

            <div className="flex-1">
              <h4 className="font-semibold text-base sm:text-lg text-zinc-900 mb-4">Includes everything in Base, plus:</h4>
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {proFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                      {feat.text}
                      {feat.info && <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400" />}
                    </span>
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-base sm:text-lg text-zinc-900 mb-4">AI features</h4>
              <ul className="space-y-3 sm:space-y-4">
                {proAiFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm leading-tight">{feat.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-5 sm:p-8 max-w-[480px] w-full shadow-2xl relative border border-zinc-200 overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
            >
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Checkout & Payment</h3>
                  <p className="text-xs text-zinc-500">Complete your membership subscription</p>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200/80 mb-6">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-200">
                  <div>
                    <div className="font-extrabold text-zinc-900 text-base">
                      {checkoutPlan === 'BASE' ? 'Base Plan' : 'Pro Plan'}
                    </div>
                    <div className="text-xs text-zinc-500 font-medium">
                      Billing cycle: <span className="font-bold text-zinc-700">{isYearly ? 'Billed Annually' : 'Monthly'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-zinc-900">
                      ₹{activeRawPrice.toLocaleString('en-IN')} <span className="text-xs text-zinc-500 font-normal">/mo</span>
                    </div>
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-600 mb-2">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-{appliedCoupon.discountPercent ? `${appliedCoupon.discountPercent}%` : `₹${appliedCoupon.flatDiscountINR}`}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-sm font-extrabold text-zinc-900">
                  <span>Total Payable:</span>
                  <span className="text-2xl font-black text-indigo-600">₹{activeFinalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-700 mb-2">Have a Promo or Coupon Code?</label>
                <form onSubmit={handleApplyCoupon} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Tag className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Enter code (e.g. DIWALI50)"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isCheckingCoupon}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    {isCheckingCoupon ? '...' : 'Apply'}
                  </button>
                </form>

                {couponMsg && (
                  <div className={`mt-3 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 ${couponMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {couponMsg.type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{couponMsg.text}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  alert(`Proceeding to Razorpay payment gateway for ₹${activeFinalPrice.toLocaleString('en-IN')}`);
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" /> Proceed to Pay ₹{activeFinalPrice.toLocaleString('en-IN')}
              </button>

              <div className="text-center text-[11px] text-zinc-400 mt-4">
                🔒 Guaranteed 256-bit encrypted secure checkout
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
