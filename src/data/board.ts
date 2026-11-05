import type { SpaceDef } from '../types/game';
import { PROPERTIES } from './properties';

export const BOARD_SIZE = 40;
export const START_INDEX = 0;
export const JAIL_INDEX = 10;
export const GO_TO_JAIL_INDEX = 30;

type Entry =
  | string // property id
  | Omit<SpaceDef, 'index'>;

const S = (type: SpaceDef['type'], nameBn: string, nameEn: string, taxAmount?: number) => ({
  type, nameBn, nameEn, taxAmount,
});

const LAYOUT: Entry[] = [
  S('start', 'শুরু', 'Start'),
  'rupsha',
  S('fortune', 'ভাগ্য', 'Fortune'),
  'sabujbag',
  S('tax', 'আয়কর', 'Income Tax', 1000),
  'rail',
  'nilachal',
  S('chance', 'সুযোগ', 'Chance'),
  'shantinagar',
  'anandapur',
  S('jail', 'জেলখানা', 'Jail'),
  'karnaphuli',
  'power',
  'meghna',
  'padma',
  'launch',
  'modhumoti',
  S('fortune', 'ভাগ্য', 'Fortune'),
  'dhansiri',
  'kashbon',
  S('rest', 'বিশ্রাম', 'Free Rest'),
  'krishnachura',
  S('chance', 'সুযোগ', 'Chance'),
  'bokultola',
  'shiulibag',
  'bus',
  'doyel',
  'jonaki',
  'water',
  'teesta',
  S('goToJail', 'জেলে যান', 'Go To Jail'),
  'jamuna',
  'surma',
  S('fortune', 'ভাগ্য', 'Fortune'),
  'chandrima',
  'airport',
  S('tax', 'ইউটিলিটি বিল', 'Utility Bill', 300),
  'subarna',
  S('tax', 'পৌর কর', 'City Tax', 500),
  'sonargaon',
];

export const BOARD: SpaceDef[] = LAYOUT.map((entry, index) => {
  if (typeof entry === 'string') {
    const p = PROPERTIES[entry];
    if (!p) throw new Error(`Unknown property ${entry}`);
    return { index, type: 'property', nameBn: p.nameBn, nameEn: p.nameEn, propertyId: p.id };
  }
  return { index, ...entry };
});

if (BOARD.length !== BOARD_SIZE) throw new Error('Board must have 40 spaces');

export const PROPERTY_POSITIONS: Record<string, number> = Object.fromEntries(
  BOARD.filter((s) => s.propertyId).map((s) => [s.propertyId!, s.index]),
);
