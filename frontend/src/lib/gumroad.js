/**
 * Helper to trigger Gumroad Overlay Checkout directly on openangels.xyz.
 * Opens as a modal overlay on top of the site instead of redirecting users away.
 */

export function openGumroadOverlay(userEmail = '', discountCode = '') {
  let url = `https://beatsprom.gumroad.com/l/vgobnh?wanted=true`;

  if (userEmail) {
    url += `&email=${encodeURIComponent(userEmail)}`;
  }
  if (discountCode) {
    url += `&discount_code=${encodeURIComponent(discountCode)}`;
  }

  // Create temporary hidden anchor tag
  const link = document.createElement('a');
  link.href = url;
  link.className = 'gumroad-button';
  link.style.display = 'none';
  document.body.appendChild(link);

  // If Gumroad JS is loaded, click will open modal overlay
  link.click();

  // Cleanup after trigger
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 1000);
}
