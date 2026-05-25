import { getConfirmed } from './bookingStorage';
import { MOCK_RETURNING_PATIENTS } from '../data/mockReturningPatients';

// Accepts: mal1042, MAL 1042, mal-1042, 1042 (auto-prepends MAL-)
export function normalizeReference(input) {
  if (!input) return '';
  const cleaned = input.toString().trim().toUpperCase().replace(/[\s-]/g, '');
  if (/^\d{4}$/.test(cleaned)) return `MAL-${cleaned}`;
  if (/^MAL\d{4}$/.test(cleaned)) return `MAL-${cleaned.slice(3)}`;
  return input.trim().toUpperCase();
}

// Returns contact details for a given reference, or null if not found.
// Real bookings take precedence over mock patients.
export function lookupPatient(reference) {
  const normalized = normalizeReference(reference);
  if (!/^MAL-\d{4}$/.test(normalized)) return null;

  const realBookings = getConfirmed();
  const realMatch = [...realBookings].reverse().find(b => b.reference === normalized);
  if (realMatch) {
    return {
      reference: normalized,
      name: realMatch.contactDetails?.name || '',
      phone: realMatch.contactDetails?.phone || '',
      email: realMatch.contactDetails?.email || '',
      source: 'real',
    };
  }

  const mockMatch = MOCK_RETURNING_PATIENTS.find(p => p.reference === normalized);
  if (mockMatch) {
    return {
      reference: normalized,
      name: mockMatch.contactDetails.name,
      phone: mockMatch.contactDetails.phone,
      email: mockMatch.contactDetails.email,
      source: 'mock',
    };
  }

  return null;
}
