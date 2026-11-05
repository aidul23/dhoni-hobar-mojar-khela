import type { ColorGroup, PropertyDef } from '../types/game';

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Rents are derived from the price using this game's own scale. */
function street(
  id: string,
  nameBn: string,
  nameEn: string,
  group: ColorGroup,
  price: number,
  houseCost: number,
): PropertyDef {
  const rents = [0.08, 0.4, 1.1, 2.6, 3.4, 4.2].map((f) => round10(price * f)) as PropertyDef['rents'];
  return { id, nameBn, nameEn, kind: 'street', group, price, rents, houseCost, mortgageValue: price / 2 };
}

function transport(id: string, nameBn: string, nameEn: string): PropertyDef {
  return {
    id, nameBn, nameEn, kind: 'transport', group: 'transport', price: 2000,
    rents: [250, 500, 1000, 2000, 0, 0], houseCost: 0, mortgageValue: 1000,
  };
}

function utility(id: string, nameBn: string, nameEn: string): PropertyDef {
  return {
    id, nameBn, nameEn, kind: 'utility', group: 'utility', price: 1500,
    rents: [0, 0, 0, 0, 0, 0], houseCost: 0, mortgageValue: 750,
  };
}

export const TRANSPORT_RENTS = [250, 500, 1000, 2000];
/** Utility rent = dice total × multiplier (index = number of utilities owned - 1). */
export const UTILITY_MULTIPLIERS = [40, 100];

export const PROPERTY_LIST: PropertyDef[] = [
  street('rupsha', 'রূপসা', 'Rupsha', 'brown', 600, 500),
  street('sabujbag', 'সবুজবাগ', 'Sabujbag', 'brown', 600, 500),
  street('nilachal', 'নীলাচল', 'Nilachal', 'sky', 1000, 500),
  street('shantinagar', 'শান্তিনগর', 'Shantinagar', 'sky', 1000, 500),
  street('anandapur', 'আনন্দপুর', 'Anandapur', 'sky', 1200, 500),
  street('karnaphuli', 'কর্ণফুলী', 'Karnaphuli', 'pink', 1400, 1000),
  street('meghna', 'মেঘনা আবাসিক', 'Meghna Residential', 'pink', 1400, 1000),
  street('padma', 'পদ্মা নগর', 'Padma Nagar', 'pink', 1600, 1000),
  street('modhumoti', 'মধুমতি', 'Modhumoti', 'orange', 1800, 1000),
  street('dhansiri', 'ধানসিঁড়ি', 'Dhansiri', 'orange', 1800, 1000),
  street('kashbon', 'কাশবন', 'Kashbon', 'orange', 2000, 1000),
  street('krishnachura', 'কৃষ্ণচূড়া সরণি', 'Krishnachura Avenue', 'red', 2200, 1500),
  street('bokultola', 'বকুলতলা', 'Bokultola', 'red', 2200, 1500),
  street('shiulibag', 'শিউলিবাগ', 'Shiulibag', 'red', 2400, 1500),
  street('doyel', 'দোয়েল নগর', 'Doyel Nagar', 'yellow', 2600, 1500),
  street('jonaki', 'জোনাকি পল্লী', 'Jonaki Palli', 'yellow', 2600, 1500),
  street('teesta', 'তিস্তা গার্ডেন', 'Teesta Garden', 'yellow', 2800, 1500),
  street('jamuna', 'যমুনা টাওয়ার', 'Jamuna Tower', 'green', 3000, 2000),
  street('surma', 'সুরমা ভিউ', 'Surma View', 'green', 3000, 2000),
  street('chandrima', 'চন্দ্রিমা হাইটস', 'Chandrima Heights', 'green', 3200, 2000),
  street('subarna', 'সুবর্ণ নগর', 'Subarna Nagar', 'navy', 3500, 2000),
  street('sonargaon', 'সোনারগাঁও', 'Sonargaon', 'navy', 4000, 2000),
  transport('rail', 'রেলস্টেশন', 'Railway Station', ),
  transport('launch', 'লঞ্চঘাট', 'Launch Ghat'),
  transport('bus', 'বাস টার্মিনাল', 'Bus Terminal'),
  transport('airport', 'বিমানবন্দর', 'Airport'),
  utility('power', 'বিদ্যুৎ কেন্দ্র', 'Power Station'),
  utility('water', 'পানি সরবরাহ', 'Water Supply'),
];

export const PROPERTIES: Record<string, PropertyDef> = Object.fromEntries(
  PROPERTY_LIST.map((p) => [p.id, p]),
);

export const GROUP_MEMBERS: Record<ColorGroup, string[]> = PROPERTY_LIST.reduce(
  (acc, p) => {
    (acc[p.group] ??= []).push(p.id);
    return acc;
  },
  {} as Record<ColorGroup, string[]>,
);

/** Tailwind-independent hex colors so they can be used in inline styles. */
export const GROUP_COLORS: Record<ColorGroup, string> = {
  brown: '#8b5a2b',
  sky: '#38bdf8',
  pink: '#ec4899',
  orange: '#f97316',
  red: '#dc2626',
  yellow: '#eab308',
  green: '#16a34a',
  navy: '#1e3a8a',
  transport: '#374151',
  utility: '#6b7280',
};
