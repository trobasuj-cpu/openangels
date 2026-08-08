/**
 * Gumroad URL Builder & Overlay Helper.
 * Formats official Gumroad links with className="gumroad-button" so gumroad.js
 * automatically intercepts clicks and displays the in-page overlay modal.
 */

export function getGumroadUrl(userEmail = '', discountCode = '') {
  let url = 'https://beatsprom.gumroad.com/l/vgobnh';
  const params = new URLSearchParams();

  params.set('wanted', 'true');

  if (userEmail) {
    params.set('email', userEmail);
  }
  if (discountCode) {
    params.set('discount_code', discountCode);
  }

  const query = params.toString();
  return `${url}?${query}`;
}

export function openGumroadOverlay(userEmail = '', discountCode = '') {
  const url = getGumroadUrl(userEmail, discountCode);

  let link = document.getElementById('gumroad-overlay-trigger');
  if (!link) {
    link = document.createElement('a');
    link.id = 'gumroad-overlay-trigger';
    link.className = 'gumroad-button';
    link.style.position = 'fixed';
    link.style.top = '-9999px';
    link.style.left = '-9999px';
    document.body.appendChild(link);
  }

  link.href = url;
  
  // Trigger click event
  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  link.dispatchEvent(evt);
}
