// Small utilities used across modules
export function nowTimestamp() {
  // Format as human-readable time (HH:MM:SS)
  return new Date().toLocaleTimeString();
}

// Safe DOM helpers
export function q(id) {
  return document.getElementById(id) || null;
}

export function getValue(id, defaultValue = '') {
  const el = q(id);
  if (!el) return defaultValue;
  if (el.type === 'checkbox') return el.checked;
  if (typeof el.value === 'string') return el.value.trim();
  return el.value;
}

export function setValue(id, value) {
  const el = q(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = value;
}

