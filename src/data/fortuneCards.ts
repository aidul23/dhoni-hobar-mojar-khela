import type { Card, CardEffect } from '../types/game';

const c = (n: number, bn: string, en: string, effect: CardEffect): Card => ({
  id: `fortune-${n}`, deck: 'fortune', bn, en, effect,
});

/** ভাগ্য (Fortune / community) cards. */
export const FORTUNE_CARDS: Card[] = [
  c(1, 'উৎসব বোনাস! ৳1,000 পান।', 'Festival bonus! Receive ৳1,000.', { type: 'gain', amount: 1000 }),
  c(2, 'চিকিৎসা খরচ। ৳500 দিন।', 'Medical expense. Pay ৳500.', { type: 'pay', amount: 500 }),
  c(3, 'বৃত্তি পেয়েছেন! ৳700 পান।', 'You won a scholarship! Receive ৳700.', { type: 'gain', amount: 700 }),
  c(4, 'মেরামত খরচ। ৳400 দিন।', 'Repair cost. Pay ৳400.', { type: 'pay', amount: 400 }),
  c(5, 'পরিবারের উপহার। ৳300 পান।', 'Family gift. Receive ৳300.', { type: 'gain', amount: 300 }),
  c(6, 'শুরুর ঘরে চলে যান।', 'Advance to Start.', { type: 'advanceTo', space: 0 }),
  c(7, 'সরাসরি জেলে যান।', 'Go directly to jail.', { type: 'goToJail' }),
  c(8, 'জেল থেকে মুক্তির কার্ড। প্রয়োজনে ব্যবহার করুন।', 'Jail release card. Keep it until needed.', { type: 'jailFreeCard' }),
  c(9, 'আপনার বিয়ে! প্রত্যেক খেলোয়াড় ৳300 উপহার দেবে।', 'Your wedding! Every player gives you ৳300.', { type: 'collectFromEach', amount: 300 }),
  c(10, 'কর ফেরত পেয়েছেন। ৳600 পান।', 'Tax refund. Receive ৳600.', { type: 'gain', amount: 600 }),
  c(11, 'স্কুলের বেতন। ৳800 দিন।', 'School fees. Pay ৳800.', { type: 'pay', amount: 800 }),
  c(12, 'বৈশাখী মেলায় লাভ। ৳500 পান।', 'Profit at the Boishakhi fair. Receive ৳500.', { type: 'gain', amount: 500 }),
  c(13, 'ধানের বাম্পার ফলন! ৳900 পান।', 'Bumper rice harvest! Receive ৳900.', { type: 'gain', amount: 900 }),
  c(14, 'বন্যায় ক্ষতি। ৳600 দিন।', 'Flood damage. Pay ৳600.', { type: 'pay', amount: 600 }),
  c(15, 'বিদ্যুৎ বিল বকেয়া। ৳250 দিন।', 'Overdue electricity bill. Pay ৳250.', { type: 'pay', amount: 250 }),
  c(16, 'উত্তরাধিকার সূত্রে ৳1,500 পেলেন।', 'You inherit ৳1,500.', { type: 'gain', amount: 1500 }),
  c(17, 'রাস্তা সংস্কার: প্রতি বাড়ি ৳400, প্রতি হোটেল ৳1,150 দিন।', 'Street repairs: pay ৳400 per house and ৳1,150 per hotel.', { type: 'repairs', perHouse: 400, perHotel: 1150 }),
  c(18, 'পাড়ার ভোজ আয়োজন। প্রত্যেককে ৳100 দিন।', 'You host a neighbourhood feast. Pay each player ৳100.', { type: 'payEach', amount: 100 }),
  c(19, 'রক্তদানের জন্য সম্মাননা। ৳200 পান।', 'Award for donating blood. Receive ৳200.', { type: 'gain', amount: 200 }),
  c(20, 'নৌকা ভ্রমণ! ২ ঘর সামনে যান।', 'Boat trip! Move forward 2 spaces.', { type: 'move', steps: 2 }),
];
