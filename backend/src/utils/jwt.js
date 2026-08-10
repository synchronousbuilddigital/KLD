const jwt = require('jsonwebtoken');

/**
 * generateAccessToken
 * Long-lived access token (30 days) sent in response body.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30d',
  });
};

/**
 * generateRefreshToken
 * Long-lived refresh token (90 days) stored in cookie/body.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d',
  });
};

/**
 * verifyRefreshToken
 * Verifies a refresh token and returns the decoded payload.
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * setAuthCookies
 * Sets both accessToken and refreshToken as HttpOnly Secure cookies.
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
  }

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    });
  }
};

/**
 * clearAuthCookies
 * Clears both accessToken and refreshToken HttpOnly cookies.
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
