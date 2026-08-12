import React from 'react';
import { useBoxStore } from '../../lib/useBoxStore';

export default function MockupsPage() {
  const setBoxModel = useBoxStore((state: any) => state.setBoxModel);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#fdfbf7', // Warm paper background
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: '#3a2e26' // Deep warm brown
    }}>
      {/* Sidebar Navigation */}
      <div style={{
        width: '260px',
        borderRight: '1px solid rgba(58, 46, 38, 0.15)',
        padding: '24px 16px',
        flexShrink: 0,
        backgroundColor: '#fdfbf7',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ padding: '10px 12px', border: '2px solid #3a2e26', borderRadius: '15px 8px 12px 18px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', backgroundColor: '#a9b396', color: '#3a2e26' }}>
              <span># All</span>
              <span style={{ color: '#3a2e26', fontSize: '12px' }}>3</span>
            </div>
            
            {[
              { name: '# Boxes', count: 3 }
            ].map((item) => (
              <div key={item.name} style={{ padding: '8px 12px', color: '#7a6a5f', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderRadius: '15px 8px 12px 18px', transition: 'all 0.2s' }} 
                   onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(169, 179, 150, 0.25)'; e.currentTarget.style.color = '#3a2e26'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#7a6a5f'; }}>
                <span>{item.name}</span>
                <span style={{ color: '#7a6a5f', fontSize: '12px' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Top Nav with Back Button */}
        <div style={{ marginBottom: '24px' }}>
          <a href="#" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#d48c70', // Terracotta
              border: '2px solid #3a2e26',
              color: '#fdfbf7',
              padding: '8px 20px',
              borderRadius: '20px 10px 15px 20px',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '2px 3px 0px #3a2e26',
              transform: 'rotate(-1deg)',
              transition: 'transform 0.2s, boxShadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) rotate(-1deg)'; e.currentTarget.style.boxShadow = '4px 5px 0px #3a2e26'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0px) rotate(-1deg)'; e.currentTarget.style.boxShadow = '2px 3px 0px #3a2e26'; }}
            >
              ← Back to Main Page
            </button>
          </a>
        </div>

        {/* Header Container */}
        <div style={{
          maxWidth: '1200px',
          backgroundColor: '#fffcf7',
          borderRadius: '30px 20px 40px 25px', // Organic shape
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          border: '2px solid #3a2e26',
          boxShadow: '6px 8px 0px rgba(212,140,112,0.3)'
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.2', color: '#3a2e26' }}>
              <span style={{ color: '#d48c70', display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span> 
              Customize & download mockups
            </h1>
            <p style={{ fontSize: '16px', color: '#7a6a5f', marginBottom: '32px', lineHeight: '1.6', fontFamily: "'Inter', sans-serif" }}>
              Explore high-quality customizable 3D mockups at BoxCraft, including packaging mockups like boxes and bottles, apparel mockups like T-shirts and hoodies, and iPhone mockups.
            </p>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="Search mockups..." 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingLeft: '44px',
                  borderRadius: '16px 8px 14px 20px',
                  border: '2px solid #3a2e26',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  fontFamily: "'Inter', sans-serif"
                }}
              />
              <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#7a6a5f' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
          
          {/* Right side illustration (simple graphic) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: 'relative', width: '250px', height: '250px' }}>
               <div style={{ position: 'absolute', bottom: '20px', right: '40px', width: '120px', height: '180px', backgroundColor: '#e8dfd5', border: '2px solid #3a2e26' }}>
                 <div style={{ position: 'absolute', top: -2, bottom: -2, left: -2, width: '40px', backgroundColor: '#d48c70', transform: 'skewY(-30deg)', transformOrigin: 'top right', right: '100%', border: '2px solid #3a2e26' }}></div>
                 <div style={{ position: 'absolute', bottom: '100%', left: -2, width: '100%', height: '50px', backgroundColor: '#fffcf7', transform: 'skewX(-60deg)', transformOrigin: 'bottom left', border: '2px solid #3a2e26' }}></div>
               </div>
            </div>
          </div>
        </div>

        {/* Grid Section */}
        <div style={{ maxWidth: '1200px' }}>
          <h2 style={{ fontSize: '16px', color: '#7a6a5f', marginBottom: '24px', fontWeight: '600', fontFamily: "'Inter', sans-serif" }}>3 Mockups</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Card 1: Reverse tuck end box mockup */}
            <a href="#workshop" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setBoxModel('rte')}>
              <div style={{ cursor: 'pointer' }}>
                <div style={{
                  backgroundColor: '#fffcf7',
                  borderRadius: '24px 16px 20px 24px',
                  padding: '20px',
                  border: '2px solid #3a2e26',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '280px',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '4px 5px 0px rgba(58, 46, 38, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '6px 8px 0px rgba(212, 140, 112, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '4px 5px 0px rgba(58, 46, 38, 0.15)';
                }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a9b396" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                  
                  {/* Static Box Representation */}
                  <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ width: '80px', height: '120px', backgroundColor: '#e8dfd5', position: 'relative', border: '2px solid #3a2e26', transform: 'skewY(-15deg)' }}>
                       <div style={{ position: 'absolute', right: '100%', top: -2, width: '40px', height: '100%', backgroundColor: '#d48c70', transform: 'skewY(30deg)', transformOrigin: 'top right', border: '2px solid #3a2e26' }}></div>
                       <div style={{ position: 'absolute', bottom: '100%', left: -2, width: '100%', height: '40px', backgroundColor: '#fffcf7', transform: 'skewX(-60deg)', transformOrigin: 'bottom left', border: '2px solid #3a2e26' }}></div>
                     </div>
                  </div>
                </div>
                <h3 style={{ fontSize: '15px', color: '#3a2e26', marginTop: '16px', textAlign: 'left', fontWeight: '600', fontFamily: "'Inter', sans-serif" }}>Reverse tuck end box mockup</h3>
              </div>
            </a>

            {/* Card 2: Tuck end box mockup */}
            <a href="#workshop" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setBoxModel('te')}>
              <div style={{ cursor: 'pointer' }}>
                <div style={{
                  backgroundColor: '#fffcf7',
                  borderRadius: '24px 16px 20px 24px',
                  padding: '20px',
                  border: '2px solid #3a2e26',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '280px',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '4px 5px 0px rgba(58, 46, 38, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '6px 8px 0px rgba(212, 140, 112, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '4px 5px 0px rgba(58, 46, 38, 0.15)';
                }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a9b396" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                  
                  {/* Static Box Representation */}
                  <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ width: '80px', height: '120px', backgroundColor: '#e8dfd5', position: 'relative', border: '2px solid #3a2e26', transform: 'skewY(-15deg)' }}>
                       <div style={{ position: 'absolute', right: '100%', top: -2, width: '40px', height: '100%', backgroundColor: '#d48c70', transform: 'skewY(30deg)', transformOrigin: 'top right', border: '2px solid #3a2e26' }}></div>
                       <div style={{ position: 'absolute', bottom: '100%', left: -2, width: '100%', height: '40px', backgroundColor: '#fffcf7', transform: 'skewX(-60deg)', transformOrigin: 'bottom left', border: '2px solid #3a2e26' }}></div>
                     </div>
                  </div>
                </div>
                <h3 style={{ fontSize: '15px', color: '#3a2e26', marginTop: '16px', textAlign: 'left', fontWeight: '600', fontFamily: "'Inter', sans-serif" }}>Tuck end box mockup</h3>
              </div>
            </a>

            {/* Card 3: Auto Lock box mockup */}
            <a href="#workshop" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setBoxModel('auto_lock')}>
              <div style={{ cursor: 'pointer' }}>
                <div style={{
                  backgroundColor: '#fffcf7',
                  borderRadius: '24px 16px 20px 24px',
                  padding: '20px',
                  border: '2px solid #3a2e26',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '280px',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '4px 5px 0px rgba(58, 46, 38, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '6px 8px 0px rgba(212, 140, 112, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '4px 5px 0px rgba(58, 46, 38, 0.15)';
                }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a9b396" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                  
                  {/* Static Box Representation */}
                  <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ width: '80px', height: '120px', backgroundColor: '#e8dfd5', position: 'relative', border: '2px solid #3a2e26', transform: 'skewY(-15deg)' }}>
                       <div style={{ position: 'absolute', right: '100%', top: -2, width: '40px', height: '100%', backgroundColor: '#d48c70', transform: 'skewY(30deg)', transformOrigin: 'top right', border: '2px solid #3a2e26' }}></div>
                       <div style={{ position: 'absolute', bottom: '100%', left: -2, width: '100%', height: '40px', backgroundColor: '#fffcf7', transform: 'skewX(-60deg)', transformOrigin: 'bottom left', border: '2px solid #3a2e26' }}></div>
                     </div>
                  </div>
                </div>
                <h3 style={{ fontSize: '15px', color: '#3a2e26', marginTop: '16px', textAlign: 'left', fontWeight: '600', fontFamily: "'Inter', sans-serif" }}>Auto lock box mockup</h3>
              </div>
            </a>

          </div>
        </div>
      </div>
    </div>
  );
}
