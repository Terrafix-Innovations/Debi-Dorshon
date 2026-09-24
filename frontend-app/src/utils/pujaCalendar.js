/**
 * Returns the Bengali Puja greeting based on the current date and time.
 * Durga Puja 2026 Dates in Kolkata:
 * - Maha Tritiya: Oct 14, 2026
 * - Maha Chaturthi: Oct 15, 2026
 * - Maha Panchami: Oct 16, 2026
 * - Maha Sasthi: Oct 17, 2026
 * - Maha Saptami: Oct 18, 2026
 * - Maha Ashtami: Oct 19, 2026
 * - Maha Navami: Oct 20, 2026
 * - Vijaya Dashami: Oct 21, 2026
 * 
 * Anything outside Tritiya to Dashami returns "শুভ শারদীয়া".
 */
export function getPujaGreeting(targetDate = new Date()) {
  const date = new Date(targetDate);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 9 = October
  const day = date.getDate();

  // Durga Puja 2026 Schedule
  if (year === 2026 && month === 9) {
    if (day === 14) {
      return 'শুভ তৃতীয়া';
    } else if (day === 15) {
      return 'শুভ চতুর্থী';
    } else if (day === 16) {
      return 'শুভ পঞ্চমী';
    } else if (day === 17) {
      return 'শুভ ষষ্ঠী';
    } else if (day === 18) {
      return 'শুভ সপ্তমী';
    } else if (day === 19) {
      return 'শুভ মহাঅষ্টমী';
    } else if (day === 20) {
      return 'শুভ মহানবমী';
    } else if (day === 21) {
      return 'শুভ বিজয়া';
    } else {
      return 'শুভ শারদীয়া';
    }
  }

  // Default fallback for any other date or before Tritiya
  return 'শুভ শারদীয়া';
}

export const PUJA_DAYS_2026 = [
  { label: 'শুভ শারদীয়া', date: 'Pre-Puja / General' },
  { label: 'শুভ তৃতীয়া', date: '14 Oct 2026' },
  { label: 'শুভ চতুর্থী', date: '15 Oct 2026' },
  { label: 'শুভ পঞ্চমী', date: '16 Oct 2026' },
  { label: 'শুভ ষষ্ঠী', date: '17 Oct 2026' },
  { label: 'শুভ সপ্তমী', date: '18 Oct 2026' },
  { label: 'শুভ মহাঅষ্টমী', date: '19 Oct 2026' },
  { label: 'শুভ মহানবমী', date: '20 Oct 2026' },
  { label: 'শুভ বিজয়া', date: '21 Oct 2026' },
];

