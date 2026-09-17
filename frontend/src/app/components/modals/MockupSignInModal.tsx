// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/auth';
import AnimatedLogo from '../layout/AnimatedLogo';
import './MockupSignInModal.css';

export default function MockupSignInModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'options' | 'signIn' | 'signUp' | 'otp' | 'forgotPassword' | 'resetPassword'>('options');
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

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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
      setInfoMsg(res.message || `A 6-digit password reset code has been sent to ${email}. Check your email inbox!`);
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

  // Aliases for the original handlers in case some forms still reference them
  const handleSignUpSendOtp = handleSendSignupOtp;

  return (
    <div className="signin-modal-overlay">
      <div className="signin-new-card">
        {/* Left Column - Mockup Pattern */}
        <div className="signin-left-pane">
        </div>
        
        {/* Right Column - Auth */}
        <div className="signin-right-pane">
          <button onClick={onClose} className="signin-close-x">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="signin-right-content">
            {mode === 'options' ? (
              <div className="signin-options-view">
                <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#111827", marginBottom: "32px", fontFamily: "'Inter', sans-serif" }}>Log in to open mockups</h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "340px", margin: "0 auto" }}>
                  {googleClientId ? (
                    <GoogleOAuthProvider clientId={googleClientId}>
                      <div className="custom-google-wrapper">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          useOneTap
                          theme="filled_black"
                          shape="rectangular"
                          text="continue_with"
                          width="340"
                        />
                      </div>
                    </GoogleOAuthProvider>
                  ) : (
                    <button className="auth-option-btn black-btn" onClick={() => setError('Google Client ID missing')}>
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="btn-icon" />
                      Continue with Google
                    </button>
                  )}

                  <button className="auth-option-btn outline-btn" type="button">
                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="F" className="btn-icon" />
                    Continue with Facebook
                  </button>

                  <button className="auth-option-btn outline-btn" type="button" onClick={() => setMode('signIn')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon text-zinc-700">
                      <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                      <polyline points="3 7 12 13 21 7"></polyline>
                    </svg>
                    Continue with email
                  </button>
                </div>

                <p className="auth-terms">
                  By continuing, you accept our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </p>
              </div>
            ) : (
              <div className="signin-form-view">
                <button onClick={() => setMode('options')} className="back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  Back
                </button>
                
                <div className="signin-form-container" style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}>
                  <div className="signin-logo-small" style={{ color: '#0f172a', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <AnimatedLogo style={{ margin: '0', transform: 'scale(0.8)' }} />
                  </div>

                  {/* STATUS MESSAGES */}
                  {error && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      <div>{error}</div>
                    </div>
                  )}
                  {infoMsg && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#22c55e', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 12 12 12 8"></polyline><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      <div>{infoMsg}</div>
                    </div>
                  )}

                  {/* SIGN IN FORM */}
                  {mode === 'signIn' && (
                    <form onSubmit={handleSignIn}>
                      <div className="signin-input-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      
                      <div className="signin-input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                          <button type="button" onClick={() => setMode('forgotPassword')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                            Forgot password?
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            id="password" 
                            placeholder="••••••••" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                            }}
                          >
                            {showPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <button type="submit" className="signin-btn" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
                        Don't have an account?{' '}
                        <button type="button" onClick={() => { setMode('signUp'); setError(null); setInfoMsg(null); }} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                          Sign Up
                        </button>
                      </div>
                    </form>
                  )}

                  {/* SIGN UP FORM (Step 1 & 2) */}
                  {mode === 'signUp' && (
                    <form onSubmit={isSignupOtpSent ? handleVerifySignupOtp : handleSignUpSendOtp}>
                      <div className="signin-input-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input type="text" id="fullName" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSignupOtpSent} style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div className="signin-input-group">
                        <label htmlFor="signup-email">Email Address</label>
                        <input type="email" id="signup-email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSignupOtpSent} style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      
                      <div className="signin-input-group">
                        <label htmlFor="signup-password">Password</label>
                        <input type={showPassword ? "text" : "password"} id="signup-password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSignupOtpSent} style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      {isSignupOtpSent && (
                        <div className="signin-input-group">
                          <label htmlFor="signup-otp">Verification Code</label>
                          <input 
                            type="text" 
                            id="signup-otp" 
                            placeholder="6-digit code" 
                            required 
                            maxLength={6}
                            style={{ letterSpacing: '2px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                            value={signupOtp} 
                            onChange={(e) => setSignupOtp(e.target.value)} 
                          />
                          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                            Code sent to {email}
                          </p>
                        </div>
                      )}
                      
                      <button type="submit" className="signin-btn" disabled={isLoading || (isSignupOtpSent && timerSeconds > 0 && signupOtp.length < 6)}>
                        {isLoading ? 'Please wait...' : (isSignupOtpSent ? 'Verify & Create Account' : 'Send Verification Code')}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
                        Already have an account?{' '}
                        <button type="button" onClick={() => { setMode('signIn'); setIsSignupOtpSent(false); setError(null); setInfoMsg(null); }} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                          Log In
                        </button>
                      </div>
                    </form>
                  )}

                  {/* FORGOT PASSWORD FORM */}
                  {mode === 'forgotPassword' && (
                    <form onSubmit={handleForgotPassword}>
                      <div className="signin-input-group">
                        <label htmlFor="forgot-email">Email Address</label>
                        <input type="email" id="forgot-email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      
                      <button type="submit" className="signin-btn" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </form>
                  )}

                  {/* RESET PASSWORD FORM */}
                  {mode === 'resetPassword' && (
                    <form onSubmit={handleResetPassword}>
                      <div className="signin-input-group">
                        <label htmlFor="reset-otp">6-Digit Reset Code</label>
                        <input type="text" id="reset-otp" placeholder="e.g. 123456" required maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} value={otp} onChange={(e) => setOtp(e.target.value)} />
                      </div>
                      
                      <div className="signin-input-group">
                        <label htmlFor="new-password">New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showPassword ? "text" : "password"} id="new-password" placeholder="••••••••" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      
                      <button type="submit" className="signin-btn" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Reset Password'}
                      </button>
                    </form>
                  )}

                  {/* OTP VERIFICATION (Standalone if needed) */}
                  {mode === 'otp' && (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="signin-input-group">
                        <label htmlFor="otp">6-Digit OTP</label>
                        <input type="text" id="otp" placeholder="e.g. 123456" required maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} value={otp} onChange={(e) => setOtp(e.target.value)} />
                      </div>
                      
                      <button type="submit" className="signin-btn" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify OTP & Log In'}
                      </button>
                    </form>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
