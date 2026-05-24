// Pakistani mobile number rules:
// - Accepts: 03001234567, 0300 123 4567, 0300-123-4567
// - Accepts: +923001234567, +92 300 123 4567
// - Normalizes to: +923001234567 (E.164)
// - Must start with 03 or +923, followed by mobile prefix (00-99)
// - Total 11 digits after country code (3XXXXXXXXX)

export function normalizePhone(input) {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('3')) return `+92${digits}`;
  return input.trim();
}

export function validatePhone(input) {
  if (!input || !input.trim()) return 'Phone number is required';
  const normalized = normalizePhone(input);
  // Must match +923XXXXXXXXX (13 chars total)
  if (!/^\+923\d{9}$/.test(normalized)) {
    return 'Enter a valid Pakistani mobile (e.g. 0300 1234567)';
  }
  return null;
}

export function validateEmail(input) {
  if (!input || !input.trim()) return null; // email is optional
  // Simple but practical: something@something.something
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim())) {
    return 'Enter a valid email address';
  }
  return null;
}

export function validateName(input) {
  if (!input || !input.trim()) return 'Name is required';
  if (input.trim().length < 2) return 'Name is too short';
  if (input.trim().length > 60) return 'Name is too long';
  // Letters, spaces, hyphens, apostrophes, periods. No digits.
  if (!/^[a-zA-ZÀ-ɏ؀-ۿ\s'\-.]+$/.test(input.trim())) {
    return 'Name contains invalid characters';
  }
  return null;
}

// Returns { isValid, errors } for the whole form
export function validateContactForm(details) {
  const errors = {
    name: validateName(details?.name),
    phone: validatePhone(details?.phone),
    email: validateEmail(details?.email),
  };
  const isValid = !errors.name && !errors.phone && !errors.email;
  return { isValid, errors };
}

// Format phone for display as user types: 0300 1234567
export function formatPhoneForDisplay(input) {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('92')) {
    const rest = digits.slice(2);
    if (rest.length <= 3) return `+92 ${rest}`;
    return `+92 ${rest.slice(0, 3)} ${rest.slice(3, 10)}`.trim();
  }
  if (digits.startsWith('0')) {
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)} ${digits.slice(4, 11)}`.trim();
  }
  return input;
}
