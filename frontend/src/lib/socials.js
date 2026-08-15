/**
 * Utility functions to cleanly format investor social URLs (Twitter/X, LinkedIn, Website).
 * Ensures direct profile links always work reliably without broken internal search pages.
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
  return `https://www.google.com/search?q=${encodeURIComponent((investor.name || '') + ' twitter x investor')}`;
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
  return `https://www.google.com/search?q=${encodeURIComponent((investor.name || '') + ' linkedin investor')}`;
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
  return `https://www.google.com/search?q=${encodeURIComponent((investor.name || '') + ' official website investor')}`;
}
