const dns = require('dns').promises;

/* ─── DISPOSABLE / TEMP EMAIL DOMAIN BLOCKLIST ─────────────────────── */
// Common throw-away / temporary email providers
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.info',
  'grr.la',
  'sharklasers.com',
  'spam4.me',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'trashmail.at',
  'trashmail.io',
  'trashmail.org',
  'yopmail.com',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minemail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempmail.com',
  'tempmail.net',
  'tempinbox.com',
  'throwam.com',
  'throwam.net',
  'throwaway.email',
  'getnada.com',
  'nada.email',
  'fakeinbox.com',
  'dispostable.com',
  'maildrop.cc',
  'mailnull.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'spamfree24.org',
  'spamfree24.de',
  'spamfree24.eu',
  'spamfree24.info',
  'spamfree24.net',
  'getairmail.com',
  'filzmail.com',
  'crazymailing.com',
  'discard.email',
  'discardmail.com',
  'discardmail.de',
  'spamhereplease.com',
  'spamherelots.com',
  'spam.la',
  'binkmail.com',
  'spaml.de',
  'inoutmail.de',
  'inoutmail.eu',
  'inoutmail.info',
  'inoutmail.net',
  'vomoto.com',
  'put2.net',
  'suremail.info',
  'spammotel.com',
  'spammotel.net',
  'amilegit.com',
  'imails.info',
  'mailnew.com',
  'meltmail.com',
  'objectmail.com',
  'ownmail.net',
  'pecinan.com',
  'spamday.com',
  'spamex.com',
  'temporaryemail.net',
  'temporaryemail.us',
  'tempr.email',
  'thanksnospam.info',
  'safetymail.info',
  'mailtemp.info',
  'mt2014.com',
  'mt2009.com',
  'eyepaste.com',
  'jnxjn.com',
  'mt2015.com',
  'poofy.org',
  'emailondeck.com',
  'mohmal.com',
  'burnermail.io',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'harakirimail.com',
  'mytrashmail.com',
  'mail.mezimages.net',
  'dingbone.com',
  'fudgerub.com',
  'lookugly.com',
  'sleepingstork.com',
  'drdrb.net',
  'drdrb.com',
  'mailme.lv',
  'spamfree.eu',
  'mailexpire.com',
  'spamgap.com',
  'uroid.com',
  'sogetthis.com',
  'zippymail.info',
  'spamfighter.cf',
  'spamfighter.ga',
  'spamfighter.gq',
  'spamfighter.ml',
  'spamfighter.tk',
  'spaml.com',
  'spamwc.de',
  'spamwc.cf',
  'spamwc.ga',
  'spamwc.gq',
  'spam4.me',
  'spam.su',
  'spamoff.de',
  'wh4f.org',
  'yuu.it',
  'lol.ovpn.to',
  'zxcv.com',
  'cmail.club',
]);

/* ─── VALIDATE EMAIL FORMAT ─────────────────────────────────────────── */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates that an email is:
 * 1. Properly formatted
 * 2. Not from a known disposable/temp email provider
 * 3. From a domain with real MX records (can actually receive email)
 *
 * @param {string} email
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateRealEmail = async (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address is required.' };
  }

  const trimmed = email.trim().toLowerCase();

  // 1. Format check
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, reason: 'Please enter a valid email address format.' };
  }

  const domain = trimmed.split('@')[1];

  // 2. Disposable email blocklist check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: 'Temporary or disposable email addresses are not allowed. Please use a real email address.',
    };
  }

  // 3. DNS MX record check — verifies the domain can actually receive emails
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: 'This email domain does not appear to be valid. Please use a real email address.',
      };
    }
  } catch (err) {
    // ENOTFOUND / ENODATA = domain doesn't exist or has no MX records
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      return {
        valid: false,
        reason: 'This email domain does not appear to be valid. Please use a real email address.',
      };
    }
    // For other DNS errors (timeout, network issue), allow through to avoid blocking real users
    console.warn(`[EmailValidator] DNS lookup warning for ${domain}:`, err.code);
  }

  return { valid: true };
};

module.exports = { validateRealEmail };
