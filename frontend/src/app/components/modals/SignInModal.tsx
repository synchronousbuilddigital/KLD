// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/auth';
import './SignInModal.css';

export default function SignInModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'otp' | 'forgotPassword' | 'resetPassword'>('signIn');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [isSignupOtpSent, setIsSignupOtpSent] = useState(false);
  const [isSignupEmailVerified, setIsSignupEmailVerified] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '451067192990-5ii3d2qhhne36opb0orr8u5lr9chdl6v.apps.googleusercontent.com';

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.googleLogin(credentialResponse.credential);
      onClose();
      if (res.data?.user?.role === 'ADMIN') {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }));
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed.');
  };

  useEffect(() => {
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authService.login(email, password);
      onClose();
      if (res.data?.user?.role === 'ADMIN') {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }));
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSignupOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    setError(null);
    setInfoMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.sendSignupOtp(email);
      setIsSignupOtpSent(true);
      setInfoMsg(res.message || `Verification code sent to ${email}. Check your inbox!`);
      setTimerSeconds(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    if (!signupOtp || signupOtp.length < 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    setError(null);
    setInfoMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.verifySignupOtp(email, signupOtp);
      setIsSignupEmailVerified(true);
      setInfoMsg('✅ Email verified successfully! Set your password below.');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSignupEmailVerified) {
      setError('Please verify your email address before creating an account.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(email, password, confirmPassword, fullName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.verifyEmail(email, otp);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setInfoMsg(res.message || 'OTP sent to your email! Enter the 6-digit code below to set a new password.');
      setMode('resetPassword');
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.resetPassword(email, otp, newPassword);
      setInfoMsg(res.message || 'Password reset successfully! Please sign in with your new password.');
      setMode('signIn');
      setPassword('');
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-modal-overlay">
      {/* High z-index Fixed Screen Close Button */}
      <button 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '32px',
          right: '40px',
          zIndex: 99999,
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          color: '#ffffff',
          fontSize: '22px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Close Login Page"
      >
        ✕
      </button>

      <div className="signin-main-card">
        <div className="signin-container">
          {/* Glassmorphism Login Form */}
          <div className="signin-login-section">
            <header className="signin-header">
              <div className="signin-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    <line x1="7.635" y1="4.48" x2="16.365" y2="9.48"></line>
                  </svg>
                  <span style={{ fontWeight: 700, letterSpacing: '1px', fontSize: '18px' }}>KEYLINE DESIGN</span>
                </div>
              </div>
            </header>
            
            <div className="signin-form-container">
              {mode === 'signIn' && (
                <>
                  <h1>Welcome Back</h1>
                  <p className="signin-subtitle">Please enter your details to sign in.</p>
                </>
              )}

              {mode === 'signUp' && (
                <>
                  <h1>Create Account</h1>
                  <p className="signin-subtitle">Join Keyline Design to save and export 3D packaging.</p>
                </>
              )}

              {mode === 'otp' && (
                <>
                  <h1>Verify Email</h1>
                  <p className="signin-subtitle">Enter the 6-digit OTP code sent to <strong>{email}</strong></p>
                </>
              )}

              {mode === 'forgotPassword' && (
                <>
                  <h1>Reset Password</h1>
                  <p className="signin-subtitle">Enter your registered email to receive a 6-digit OTP reset code.</p>
                </>
              )}

              {mode === 'resetPassword' && (
                <>
                  <h1>Set New Password</h1>
                  <p className="signin-subtitle">Enter the 6-digit OTP code and your new password.</p>
                </>
              )}

              {error && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '20px'
                }}>
                  {error}
                </div>
              )}

              {infoMsg && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '12px',
                  color: '#86efac',
                  fontSize: '0.85rem',
                  marginBottom: '20px'
                }}>
                  {infoMsg}
                </div>
              )}

              {/* SIGN IN FORM */}
              {mode === 'signIn' && (
                <form onSubmit={handleSignIn}>
                  <div className="signin-input-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      placeholder="Enter your email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  
                  <div className="signin-input-group">
                    <label htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="password" 
                        placeholder="Enter your password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={{ paddingRight: '48px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="signin-actions">
                    <label className="signin-remember">
                      <input type="checkbox" defaultChecked /> Remember me
                    </label>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setMode('forgotPassword'); setError(null); setInfoMsg(null); }} 
                      className="signin-forgot-password"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  
                  <button type="submit" className="signin-btn" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '10px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Don't have an account?{' '}
                    <span 
                      onClick={() => { setMode('signUp'); setError(null); setInfoMsg(null); }}
                      style={{ color: '#ffffff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Create a new account
                    </span>
                  </div>
                </form>
              )}

              {/* SIGN UP FORM WITH EMAIL OTP & CONFIRM PASSWORD */}
              {mode === 'signUp' && (
                <form onSubmit={handleSignUp}>

                  {/* FULL NAME */}
                  <div className="signin-input-group">
                    <label htmlFor="fullName">
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      id="fullName" 
                      placeholder="Enter your full name" 
                      required 
                      disabled={isLoading}
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                    />
                  </div>

                  {/* EMAIL FIELD + VERIFIED BADGE */}
                  <div className="signin-input-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label htmlFor="email" style={{ margin: 0 }}>
                        Email Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {isSignupEmailVerified && (
                        <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, marginLeft: 'auto' }}>
                          ✓ Email Verified
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="email" 
                        id="email" 
                        placeholder="Enter your email address" 
                        required 
                        disabled={isSignupEmailVerified || isLoading}
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        style={{ paddingRight: isSignupEmailVerified ? '40px' : '12px' }}
                      />
                      {isSignupEmailVerified && (
                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4ade80', fontWeight: 800 }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* STEP 1: SEND OTP BUTTON / OTP CODE INPUT */}
                  {!isSignupEmailVerified && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '16px' }}>
                      {!isSignupOtpSent ? (
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                            Email Verification <span style={{ color: '#ef4444' }}>*</span> (Send 6-digit code to email)
                          </p>
                          <button
                            type="button"
                            onClick={handleSendSignupOtp}
                            className="signin-btn"
                            disabled={isLoading || !email}
                            style={{ padding: '10px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
                          >
                            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label htmlFor="signupOtp" style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                            Enter 6-Digit Verification Code <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input 
                            type="text" 
                            id="signupOtp" 
                            placeholder="e.g. 849201" 
                            maxLength={6}
                            value={signupOtp} 
                            onChange={(e) => setSignupOtp(e.target.value)} 
                            style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center', marginBottom: '10px', width: '100%' }}
                          />
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={handleVerifySignupOtp}
                              className="signin-btn"
                              disabled={isLoading || signupOtp.length < 6}
                              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                            >
                              {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button
                              type="button"
                              onClick={handleSendSignupOtp}
                              disabled={timerSeconds > 0 || isLoading}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: timerSeconds > 0 ? '#64748b' : '#cbd5e1',
                                fontSize: '0.8rem',
                                cursor: timerSeconds > 0 ? 'default' : 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              {timerSeconds > 0 ? `Resend (${timerSeconds}s)` : 'Resend Code'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PASSWORD (ALWAYS VISIBLE) */}
                  <div className="signin-input-group">
                    <label htmlFor="password">
                      Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="password" 
                        placeholder="At least 8 characters" 
                        required 
                        minLength={8}
                        disabled={isLoading}
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={{ paddingRight: '48px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD RE-VERIFICATION (ALWAYS VISIBLE) */}
                  <div className="signin-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="confirmPassword" style={{ margin: 0 }}>
                        Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {confirmPassword && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: password === confirmPassword ? '#4ade80' : '#fca5a5' }}>
                          {password === confirmPassword ? '✓ Passwords match' : 'Passwords do not match'}
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        id="confirmPassword" 
                        placeholder="Re-enter password to confirm" 
                        required 
                        minLength={8}
                        disabled={isLoading}
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        style={{ 
                          paddingRight: '48px',
                          borderColor: confirmPassword ? (password === confirmPassword ? 'rgba(74, 222, 128, 0.6)' : 'rgba(239, 68, 68, 0.6)') : undefined
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="signin-btn" 
                    disabled={isLoading}
                    style={{ marginTop: '8px' }}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '12px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <span 
                      onClick={() => { setMode('signIn'); setError(null); setInfoMsg(null); }}
                      style={{ color: '#ffffff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Sign In
                    </span>
                  </div>
                </form>
              )}

              {/* FORGOT PASSWORD - STEP 1 (REQUEST OTP) */}
              {mode === 'forgotPassword' && (
                <form onSubmit={handleForgotPassword}>
                  <div className="signin-input-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      placeholder="Enter your registered email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  
                  <button type="submit" className="signin-btn" disabled={isLoading}>
                    {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '-10px' }}>
                    <button 
                      type="button" 
                      onClick={() => { setMode('signIn'); setError(null); setInfoMsg(null); }} 
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* FORGOT PASSWORD - STEP 2 (RESET PASSWORD WITH OTP) */}
              {mode === 'resetPassword' && (
                <form onSubmit={handleResetPassword}>
                  <div className="signin-input-group">
                    <label htmlFor="otp">6-Digit Reset OTP</label>
                    <input 
                      type="text" 
                      id="otp" 
                      placeholder="e.g. 849201" 
                      required 
                      maxLength={6}
                      style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                    />
                  </div>

                  <div className="signin-input-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="newPassword" 
                        placeholder="At least 8 characters" 
                        required 
                        minLength={8}
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        style={{ paddingRight: '48px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <button type="submit" className="signin-btn" disabled={isLoading}>
                    {isLoading ? 'Updating Password...' : 'Reset Password & Log In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '-10px' }}>
                    <button 
                      type="button" 
                      onClick={() => { setMode('forgotPassword'); setError(null); setInfoMsg(null); }} 
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      ← Request New Code
                    </button>
                  </div>
                </form>
              )}

              {/* OTP VERIFICATION FORM */}
              {mode === 'otp' && (
                <form onSubmit={handleVerifyOtp}>
                  <div className="signin-input-group">
                    <label htmlFor="otp">6-Digit OTP</label>
                    <input 
                      type="text" 
                      id="otp" 
                      placeholder="e.g. 123456" 
                      required 
                      maxLength={6}
                      style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                    />
                  </div>
                  
                  <button type="submit" className="signin-btn" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify OTP & Log In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '-20px' }}>
                    <button 
                      type="button" 
                      onClick={() => setMode('signUp')} 
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      ← Back to Sign Up
                    </button>
                  </div>
                </form>
              )}
              
              {mode !== 'otp' && mode !== 'forgotPassword' && mode !== 'resetPassword' && (
                <div className="signin-social-login" style={{ marginTop: '20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 20px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }}></div>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>OR CONTINUE WITH</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '44px' }}>
                    {googleClientId ? (
                      <GoogleOAuthProvider clientId={googleClientId}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          theme="filled_black"
                          size="large"
                          text="continue_with"
                          shape="pill"
                          width="300"
                        />
                      </GoogleOAuthProvider>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setError('Google OAuth Client ID is not configured in backend/.env or frontend/.env.development.')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          width: '100%',
                          maxWidth: '300px',
                          padding: '10px 20px',
                          borderRadius: '9999px',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.35 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
                        </svg>
                        Continue with Google
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Animated 3D Stacked Boxes */}
        <div className="signin-stack-container">
          <div className="signin-floor-shadow"></div>
          <div className="signin-box-stack">
            {/* Box 5 (Top Center) */}
            <div className="signin-box-drop signin-box5-drop">
              <div className="signin-cardboard-box" style={{ '--w': '160px', '--h': '120px', '--d': '140px', '--lh': '30px' } as any}>
                <div className="signin-c-body">
                  <div className="signin-c-face signin-c-front signin-has-tape-x"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top signin-has-tape-z"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
                <div className="signin-c-lid">
                  <div className="signin-c-face signin-c-front signin-has-tape-x"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top signin-has-tape-z"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
              </div>
            </div>

            {/* Box 4 (Middle Left, Small) */}
            <div className="signin-box-drop signin-box4-drop">
              <div className="signin-cardboard-box" style={{ '--w': '120px', '--h': '80px', '--d': '100px', '--lh': '25px' } as any}>
                <div className="signin-c-body">
                  <div className="signin-c-face signin-c-front signin-has-tape-x"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top signin-has-tape-z"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
                <div className="signin-c-lid">
                  <div className="signin-c-face signin-c-front signin-has-tape-x"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top signin-has-tape-z"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
              </div>
            </div>

            {/* Box 3 (Middle Right) */}
            <div className="signin-box-drop signin-box3-drop">
              <div className="signin-cardboard-box" style={{ '--w': '280px', '--h': '140px', '--d': '200px', '--lh': '35px' } as any}>
                <div className="signin-c-body">
                  <div className="signin-c-face signin-c-front" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(50, 30, 20, 0.85)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', transform: 'scale(1.4)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        <line x1="7.635" y1="4.48" x2="16.365" y2="9.48"></line>
                      </svg>
                      <span style={{ fontWeight: 800, letterSpacing: '1px', fontSize: '16px', lineHeight: 1.1 }}>KEYLINE<br />DESIGN</span>
                    </div>
                  </div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
                <div className="signin-c-lid">
                  <div className="signin-c-face signin-c-front"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
              </div>
            </div>

            {/* Box 2 (Bottom Left) */}
            <div className="signin-box-drop signin-box2-drop">
              <div className="signin-cardboard-box" style={{ '--w': '200px', '--h': '90px', '--d': '140px', '--lh': '30px' } as any}>
                <div className="signin-c-body">
                  <div className="signin-c-face signin-c-front"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
                <div className="signin-c-lid">
                  <div className="signin-c-face signin-c-front"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
              </div>
            </div>

            {/* Box 1 (Bottom Right) */}
            <div className="signin-box-drop signin-box1-drop">
              <div className="signin-cardboard-box" style={{ '--w': '300px', '--h': '100px', '--d': '220px', '--lh': '35px' } as any}>
                <div className="signin-c-body">
                  <div className="signin-c-face signin-c-front"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
                <div className="signin-c-lid">
                  <div className="signin-c-face signin-c-front"></div>
                  <div className="signin-c-face signin-c-back"></div>
                  <div className="signin-c-face signin-c-right"></div>
                  <div className="signin-c-face signin-c-left"></div>
                  <div className="signin-c-face signin-c-top"></div>
                  <div className="signin-c-face signin-c-bottom"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
