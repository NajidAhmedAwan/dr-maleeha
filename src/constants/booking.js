export const CITIES = ['Karachi', 'Islamabad', 'Online'];

// Clinic operating hours (24h slot start times)
export const SLOT_HOURS = [11, 12, 13, 14, 15, 16, 17]; // 11AM–5PM, 7 slots

// Islamabad clinic only operates Tue, Thu, Sat (Faisal Market, F-7/1)
// JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const ISLAMABAD_OPEN_DAYS = [2, 4, 6];

// Karachi clinic operates every day (adjust later if needed)
export const KARACHI_OPEN_DAYS = [0, 1, 2, 3, 4, 5, 6];

// Online operates every day
export const ONLINE_OPEN_DAYS = [0, 1, 2, 3, 4, 5, 6];

// Deposit percentages by city + lead time
// Same-day always overrides to 100%
export const DEPOSIT_RULES = {
  Karachi:   { standard: 20, sameDay: 100 },
  Islamabad: { standard: 20, sameDay: 100 },
  Online:    { standard: 50, sameDay: 100 },
};

// Waitlist confirmation windows (how long patient has to confirm slot)
// Keyed by days-of-lead-time bucket
export const WAITLIST_WINDOWS = {
  '7plus':   { label: '1 day',    hours: 24 },
  '3to6':    { label: '12 hours', hours: 12 },
  '2':       { label: '6 hours',  hours: 6  },
  'sameDay': { label: '1 hour',   hours: 1  },
};
