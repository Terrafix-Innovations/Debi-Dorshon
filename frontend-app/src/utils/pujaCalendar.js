/**
 * Returns the Bengali Puja greeting dynamically based on the current date and time.
 * Durga Puja Schedule Mapping:
 * - Tritiya to Vijaya Dashami have specific greetings on their respective dates.
 * - Any date outside this range returns the timeless general greeting "শুভ শারদীয়া".
 */

export const PUJA_SCHEDULE = {
  2025: {
    '09-25': { greeting: 'শুভ তৃতীয়া', english: 'Maha Tritiya' },
    '09-26': { greeting: 'শুভ চতুর্থী', english: 'Maha Chaturthi' },
    '09-27': { greeting: 'শুভ পঞ্চমী', english: 'Maha Panchami' },
    '09-28': { greeting: 'শুভ ষষ্ঠী', english: 'Maha Sasthi' },
    '09-29': { greeting: 'শুভ সপ্তমী', english: 'Maha Saptami' },
    '09-30': { greeting: 'শুভ মহাঅষ্টমী', english: 'Maha Ashtami' },
    '10-01': { greeting: 'শুভ মহানবমী', english: 'Maha Navami' },
    '10-02': { greeting: 'শুভ বিজয়া', english: 'Vijaya Dashami' },
  },
  2026: {
    '10-13': { greeting: 'শুভ তৃতীয়া', english: 'Maha Tritiya' },
    '10-14': { greeting: 'শুভ চতুর্থী', english: 'Maha Chaturthi' },
    '10-15': { greeting: 'শুভ পঞ্চমী', english: 'Maha Panchami' },
    '10-16': { greeting: 'শুভ ষষ্ঠী', english: 'Maha Shashthi' },
    '10-17': { greeting: 'শুভ সপ্তমী', english: 'Maha Saptami' },
    '10-18': { greeting: 'শুভ সপ্তমী', english: 'Maha Saptami' },
    '10-19': { greeting: 'শুভ মহাঅষ্টমী', english: 'Maha Ashtami' },
    '10-20': { greeting: 'শুভ মহানবমী', english: 'Maha Navami' },
    '10-21': { greeting: 'শুভ বিজয়া', english: 'Vijaya Dashami' },
  },
};

export function getPujaGreeting(targetDate = new Date()) {
  const date = new Date(targetDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${month}-${day}`;

  const yearSchedule = PUJA_SCHEDULE[year];
  if (yearSchedule && yearSchedule[dateKey]) {
    return yearSchedule[dateKey].greeting;
  }

  // Default fallback for any other date outside key Puja days
  return 'শুভ শারদীয়া';
}

export const PUJA_DAYS_2026 = [
  { label: 'শুভ শারদীয়া', date: 'Pre-Puja / Post-Puja General' },
  { label: 'শুভ তৃতীয়া', date: '13 Oct 2026 (Tuesday)' },
  { label: 'শুভ চতুর্থী', date: '14 Oct 2026 (Wednesday)' },
  { label: 'শুভ পঞ্চমী', date: '15 Oct 2026 (Thursday)' },
  { label: 'শুভ ষষ্ঠী', date: '16 Oct 2026 (Friday)' },
  { label: 'শুভ সপ্তমী', date: '17–18 Oct 2026 (Saturday–Sunday)' },
  { label: 'শুভ মহাঅষ্টমী', date: '19 Oct 2026 (Monday)' },
  { label: 'শুভ মহানবমী', date: '20 Oct 2026 (Tuesday)' },
  { label: 'শুভ বিজয়া', date: '21 Oct 2026 (Wednesday)' },
];


