/**
 * Security helper to sanitize investor objects for public/non-premium consumption.
 * Ensures email, social media links, and exact check sizes are NEVER leaked to non-premium clients.
 */

export function sanitizePublicInvestor(investor) {
  if (!investor) return null;

  const {
    email,
    linkedin_url,
    twitter_url,
    website,
    check_min,
    check_max,
    ...publicData
  } = investor;

  return {
    ...publicData,
    has_email: !!email,
    has_linkedin: !!linkedin_url,
    has_twitter: !!twitter_url,
    has_website: !!website,
  };
}

export function sanitizePublicInvestorList(investors) {
  if (!Array.isArray(investors)) return [];
  return investors.map(sanitizePublicInvestor);
}
