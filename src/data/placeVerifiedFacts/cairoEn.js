/** English sentences for the Cairo pilot cards. Fact tokens stay as in the Korean value. */

const EN_VALUES = {
  'cairo:entry':
    'e-Visa eligibility depends on nationality. Check visa2egypt.gov.eg.\nApply on the government portal and pay by card.\nA tourist single entry is 25달러, and a multiple entry is 60달러.\nYour passport must have at least 6개월 left on the arrival date. Bring a printed e-Visa, your travel itinerary, and your accommodation booking.',
  'cairo:airport':
    'Take a white taxi that has a meter.\nOlder black-and-white taxis have no meter, so agree the fare before you ride.\nBe careful of drivers who solicit in the arrivals hall.\nThe curbside limousine in front of the terminal is a flat fare by destination and car class A~D.\nCity buses depart only from the bus stop in the parking lot in front of Terminal 1.\nThere is a ride-hailing app (Uber) CAI pickup guide page.',
  'cairo:itinerary':
    'D1 When you arrive, use the airport-to-city way above to get into the city and rest.\nD2 Go to the Giza Plateau early for the 07:00 opening. GEM requires a timed ticket. Galleries are open until 21:00 on Wed and Sat, and until 18:00 on other days. Last entry is 1시간 before closing. Dinner is Koshary Abou Tarek downtown.\nD3 At 09:00 go to the Egyptian Museum in Tahrir. Ticket sales end at 16:00. In the afternoon go to the Sultan Hassan Mosque, and last entry is 16:00.',
  'cairo:money-safety':
    'The currency is the Egyptian pound (EGP).\nOn the MOFA travel alert, Nile-valley cities such as Cairo are at the exercise-caution level.\nParts of the Western Desert and southern Sinai are at the reconsider-travel level, and central and northern Sinai plus the area within 30km of the Libya border are at the leave-the-country advisory.\nA recent embassy notice (2026-09-22) says to be careful amid military tension in the Middle East and to watch out for private currency-exchange scams.\nThe consular call center is +82-2-3210-0404.',
  'grand-egyptian-museum:hours':
    'Sun, Mon, Tue, Thu, and Fri: galleries 09:00~18:00 (complex 08:30~19:00), last entry 17:00.\nWed and Sat: galleries 09:00~21:00 (complex 08:30~22:00), last entry 20:00.',
  'grand-egyptian-museum:fee':
    'Foreign adults 1,590 EGP, children and students 800 EGP.\nUnder 6세 is free.\nPick an entry window: 08:30–11:00, 11:00–13:00, 13:00–15:00, or 15:00–17:00.',
  'grand-egyptian-museum:notes':
    'No refunds.\nValid only on the booked date and time.\nYou can enter only once and cannot come back in.\nThe ticket cannot be put in another person\'s name or transferred.\nBags larger than 40×40cm and umbrellas must be left at the cloakroom.\nOutside food and drinks are not allowed. Inside the galleries, only a small water bottle is allowed.\nTripods, selfie sticks, drones, external lights, and flash are not allowed.',
  'sultan-hassan-mosque:hours':
    'Open daily 09:00~17:00.\nLast entry is 16:00.\nLast entry in Ramadan is 15:00.',
  'sultan-hassan-mosque:fee':
    'Foreign adults 220 EGP, students 110 EGP.\nAdmission to the mosque across the street is included.',
  'sultan-hassan-mosque:notes':
    'Phone photos are free.\nArrive at least 1시간 before closing.\nIt is on Salah al-Din Square, across from the mosque opposite.',
};

const SOURCE_EN = {
  '카이로국제공항 교통 안내': 'Cairo International Airport transport guide',
  'GATEO 로그북 (2026-10-03)': 'GATEO logbook (2026-10-03)',
  '외교부 여행경보': 'MOFA travel alert',
  '대사관 공지': 'Embassy notice',
  'GEM 공식 예매처': 'GEM official ticket office',
  '관광유물부 giza-plateau': 'Ministry of Tourism and Antiquities giza-plateau',
  '관광유물부 egyptian-museum': 'Ministry of Tourism and Antiquities egyptian-museum',
  '관광유물부 sultan-hasan': 'Ministry of Tourism and Antiquities sultan-hasan',
  '관광유물부 예매': 'Ministry of Tourism and Antiquities tickets',
  '관광유물부 예매(egymonuments.com)': 'Ministry of Tourism and Antiquities tickets (egymonuments.com)',
  'Google 지도': 'Google Maps',
  'tickets.gem.eg (약관)': 'tickets.gem.eg (terms)',
};

const LINK_EN = {
  'GEM 공식 예매': 'Official GEM tickets',
  'Google 지도': 'Google Maps',
  '관광유물부 공식 예매': 'Official antiquities tickets',
  '공식 예매': 'Official tickets',
};

const TOKEN_RE = /https?:\/\/[^\s)]+|\+\d{2}-\d-\d{4}-\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}(?:[~–-]\d{1,2}:\d{2})?|\d{1,3}(?:,\d{3})+\s*EGP|\d+\s*EGP|\d+달러|\d+개월|\d+km|\d+×\d+cm|\d+세|\d+시간|(?<![A-Za-z])\d+(?![A-Za-z])/g;

export function extractFactTokens(text) {
  return (String(text || '').match(TOKEN_RE) || []).slice().sort();
}

export function factValueForLocale(slug, slot, locale) {
  const value = String(slot?.value || '');
  if (locale !== 'en') return value;
  const translated = EN_VALUES[`${slug}:${slot?.id}`];
  return translated == null ? value : translated;
}

export function sourceNameForLocale(name, locale) {
  const text = String(name || '');
  if (locale !== 'en') return text;
  return SOURCE_EN[text] || text;
}

export function linkLabelForLocale(label, locale) {
  const text = String(label || '');
  if (locale !== 'en' || !text) return text;
  return LINK_EN[text] || text;
}

export function checkedAtForLocale(checkedAt, locale) {
  const text = String(checkedAt || '');
  if (locale !== 'en') return text;
  return text.replaceAll('(시간)', '(hours)').replaceAll('(동선)', '(itinerary)');
}
