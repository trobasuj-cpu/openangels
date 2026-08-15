/**
 * Utility functions to cleanly format investor social URLs (Twitter/X, LinkedIn, Website).
 * Always returns direct profile links from database or constructed direct handles.
 * Never generates search URLs.
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
  if (investor.has_twitter || investor.twitter_url) {
    if (investor.slug) return `https://x.com/${investor.slug.replace(/-/g, '')}`;
    if (investor.name) return `https://x.com/${investor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
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
  if (investor.has_linkedin || investor.linkedin_url) {
    if (investor.slug) return `https://www.linkedin.com/in/${investor.slug}`;
    if (investor.name) return `https://www.linkedin.com/in/${investor.name.toLowerCase().replace(/\s+/g, '-')}`;
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
