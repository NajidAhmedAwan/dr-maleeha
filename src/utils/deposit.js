import { DEPOSIT_RULES } from '../constants/booking';
import { getLeadTimeBucket } from './slots';

// Returns { percent, amount, isSameDay }
export function calculateDeposit(city, procedurePrice, slotIso) {
  if (!city || !procedurePrice || !slotIso) {
    return { percent: 0, amount: 0, isSameDay: false };
  }
  const bucket    = getLeadTimeBucket(slotIso);
  const isSameDay = bucket === 'sameDay';
  const rule      = DEPOSIT_RULES[city] || DEPOSIT_RULES.Karachi;
  const percent   = isSameDay ? rule.sameDay : rule.standard;
  const amount    = Math.round((procedurePrice * percent) / 100);
  return { percent, amount, isSameDay };
}
