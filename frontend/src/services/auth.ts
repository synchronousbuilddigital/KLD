import { API_BASE_URL } from '../config/api';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  plan?: string;
  aiCredits?: number;
}

export const authService = {
  // Send Email Signup OTP
  sendSignupOtp: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/send-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send verification code.');
    return data;
  },

  // Verify Email Signup OTP
  verifySignupOtp: async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed. Invalid code.');
    return data;
  },

  // Register a new user
  register: async (email: string, password: string, confirmPassword?: string, fullName?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, confirmPassword, fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    if (data.data?.user) {
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.accessToken) localStorage.setItem('token', data.data.accessToken);
      if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('isLoggedIn', 'true');
      window.dispatchEvent(new Event('auth-change'));
    }
    return data;
  },

  // Verify email OTP
  verifyEmail: async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    if (data.data?.user) {
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.accessToken) localStorage.setItem('token', data.data.accessToken);
      if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('isLoggedIn', 'true');
      window.dispatchEvent(new Event('auth-change'));
    }
    return data;
  },

  // Login existing user
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.data?.user) {
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.accessToken) localStorage.setItem('token', data.data.accessToken);
      if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('isLoggedIn', 'true');
      window.dispatchEvent(new Event('auth-change'));
    }
    return data;
  },

  // Google OAuth Login
  googleLogin: async (credential: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Google authentication failed');
    if (data.data?.user) {
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.accessToken) localStorage.setItem('token', data.data.accessToken);
      if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('isLoggedIn', 'true');
      window.dispatchEvent(new Event('auth-change'));
    }
    return data;
  },

  // Logout
  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new Event('auth-change'));
    }
  },

  // Forgot password - Request OTP
  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');
    return data;
  },

  // Reset password - Submit OTP and New Password
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Password reset failed.');
    return data;
  },

  // Get Current User Profile
  getCurrentUser: (): UserProfile | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
