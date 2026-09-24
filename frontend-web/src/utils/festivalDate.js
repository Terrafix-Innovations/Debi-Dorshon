/**
 * Durga Puja Tithi & Greeting Resolution Helper
 * 
 * Requirements:
 * 1. Dynamic range from Tritiya (তৃতীয়া) to Dashami (দশমী).
 * 2. On rest of the days throughout the year, displays "শুভ শারদীয়া" (Shubho Sharodiya).
 */

export const PUJA_TITHIS = [
  { key: 'tritiya', title: 'তৃতীয়া', fullGreeting: 'শুভ তৃতীয়া', english: 'Tritiya' },
  { key: 'chaturthi', title: 'চতুর্থী', fullGreeting: 'শুভ চতুর্থী', english: 'Chaturthi' },
  { key: 'panchami', title: 'পঞ্চমী', fullGreeting: 'শুভ পঞ্চমী', english: 'Panchami' },
  { key: 'shashthi', title: 'ষষ্ঠী', fullGreeting: 'শুভ ষষ্ঠী', english: 'Maha Shashthi' },
  { key: 'saptami', title: 'সপ্তমী', fullGreeting: 'শুভ সপ্তমী', english: 'Maha Saptami' },
  { key: 'ashtami', title: 'মহা অষ্টমী', titleShort: 'অষ্টমী', fullGreeting: 'শুভ মহা অষ্টমী', english: 'Maha Ashtami' },
  { key: 'nabami', title: 'মহা নবমী', titleShort: 'নবমী', fullGreeting: 'শুভ মহা নবমী', english: 'Maha Nabami' },
  { key: 'dashami', title: 'বিজয়া দশমী', titleShort: 'দশমী', fullGreeting: 'শুভ বিজয়া দশমী', english: 'Bijoya Dashami' },
];

export const REST_DAY_GREETING = {
  key: 'sharodiya',
  title: 'শারদীয়া',
  fullGreeting: 'শুভ শারদীয়া',
  english: 'Shubho Sharodiya',
};

// Known calendar windows for Durga Puja across recent & upcoming years (YYYY-MM-DD)
const PUJA_CALENDAR_MAP = {
  // 2024
  '2024-10-06': 'tritiya',
  '2024-10-07': 'chaturthi',
  '2024-10-08': 'panchami',
  '2024-10-09': 'shashthi',
  '2024-10-10': 'saptami',
  '2024-10-11': 'ashtami',
  '2024-10-12': 'nabami',
  '2024-10-13': 'dashami',

  // 2025
  '2025-09-26': 'tritiya',
  '2025-09-27': 'chaturthi',
  '2025-09-28': 'panchami',
  '2025-09-29': 'shashthi',
  '2025-09-30': 'saptami',
  '2025-10-01': 'ashtami',
  '2025-10-02': 'nabami',
  '2025-10-03': 'dashami',

  // 2026
  '2026-10-16': 'tritiya',
  '2026-10-17': 'chaturthi',
  '2026-10-18': 'panchami',
  '2026-10-19': 'shashthi',
  '2026-10-20': 'saptami',
  '2026-10-21': 'ashtami',
  '2026-10-22': 'nabami',
  '2026-10-23': 'dashami',
};

/**
 * Resolves current festival greeting based on date or explicit override key.
 *
 * @param {string|null} overrideKey - 'tritiya'|'chaturthi'|'panchami'|'shashthi'|'saptami'|'ashtami'|'nabami'|'dashami'|'sharodiya'
 * @param {Date} date - Optional Date object (defaults to new Date())
 * @returns {{ prefix: string, suffix: string, fullGreeting: string, isPujaDay: boolean, key: string, english: string }}
 */
export function getFestivalGreeting(overrideKey = null, date = new Date()) {
  // 1. If user explicitly chose a specific day override
  if (overrideKey) {
    if (overrideKey === 'sharodiya') {
      return {
        prefix: 'শুভ',
        suffix: REST_DAY_GREETING.title,
        fullGreeting: REST_DAY_GREETING.fullGreeting,
        isPujaDay: false,
        key: REST_DAY_GREETING.key,
        english: REST_DAY_GREETING.english,
      };
    }
    const match = PUJA_TITHIS.find((t) => t.key === overrideKey);
    if (match) {
      return {
        prefix: 'শুভ',
        suffix: match.title,
        fullGreeting: match.fullGreeting,
        isPujaDay: true,
        key: match.key,
        english: match.english,
      };
    }
  }

  // 2. Check calendar mapping based on local YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  const mappedKey = PUJA_CALENDAR_MAP[dateKey];
  if (mappedKey) {
    const match = PUJA_TITHIS.find((t) => t.key === mappedKey);
    if (match) {
      return {
        prefix: 'শুভ',
        suffix: match.title,
        fullGreeting: match.fullGreeting,
        isPujaDay: true,
        key: match.key,
        english: match.english,
      };
    }
  }

  // 3. Rest of the days throughout the year: "শুভ শারদীয়া"
  return {
    prefix: 'শুভ',
    suffix: REST_DAY_GREETING.title,
    fullGreeting: REST_DAY_GREETING.fullGreeting,
    isPujaDay: false,
    key: REST_DAY_GREETING.key,
    english: REST_DAY_GREETING.english,
  };
}
