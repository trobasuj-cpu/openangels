/**
 * Utility functions to cleanly format investor social URLs (Twitter/X, LinkedIn, Website).
 * Returns the exact direct profile link from database. Never generates search fallbacks.
 */

export function formatTwitterUrl(investor) {
  if (!investor) return '';
  const url = investor.twitter_url || investor.twitter;
  if (url && typeof url === 'string' && url.trim().length > 0) {
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    const handle = clean.replace(/^@/, '').replace(/^x\.com\//, '').replace(/^twitter\.com\//, '');
    return `https://x.com/${handle}`;
  }
  return '';
}

export function formatLinkedinUrl(investor) {
  if (!investor) return '';
  const url = investor.linkedin_url || investor.linkedin;
  if (url && typeof url === 'string' && url.trim().length > 0) {
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    const path = clean.replace(/^\//, '');
    return path.startsWith('in/') ? `https://www.linkedin.com/${path}` : `https://www.linkedin.com/in/${path}`;
  }
  return '';
}

export function formatWebsiteUrl(investor) {
  if (!investor) return '';
  const url = investor.website;
  if (url && typeof url === 'string' && url.trim().length > 0) {
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    return `https://${clean}`;
  }
  return '';
}
