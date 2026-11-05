import type { Card, CardEffect } from '../types/game';

const c = (n: number, bn: string, en: string, effect: CardEffect): Card => ({
  id: `chance-${n}`, deck: 'chance', bn, en, effect,
});

/** সুযোগ (Chance) cards. */
export const CHANCE_CARDS: Card[] = [
  c(1, 'লটারিতে জিতেছেন! ৳500 পান।', 'You won a lottery! Receive ৳500.', { type: 'gain', amount: 500 }),
  c(2, 'ট্রাফিক আইন ভঙ্গ। জরিমানা ৳300 দিন।', 'Traffic violation. Pay a ৳300 fine.', { type: 'pay', amount: 300 }),
  c(3, 'রিকশা পেয়ে গেলেন! ৩ ঘর সামনে যান।', 'You caught a rickshaw! Move forward 3 spaces.', { type: 'move', steps: 3 }),
  c(4, 'সরাসরি জেলে যান। শুরু পার হলেও টাকা পাবেন না।', 'Go directly to jail. Do not collect the Start bonus.', { type: 'goToJail' }),
  c(5, 'শুরুর ঘরে চলে যান।', 'Advance to Start.', { type: 'advanceTo', space: 0 }),
  c(6, 'আজ আপনার জন্মদিন! প্রত্যেক খেলোয়াড়ের কাছ থেকে ৳200 পান।', "It's your birthday! Receive ৳200 from every player.", { type: 'collectFromEach', amount: 200 }),
  c(7, 'ভুল রাস্তায় চলে গেছেন। ৩ ঘর পিছিয়ে যান।', 'Wrong turn. Move back 3 spaces.', { type: 'move', steps: -3 }),
  c(8, 'সোনারগাঁও ঘুরে আসুন।', 'Take a trip to Sonargaon.', { type: 'advanceTo', space: 39 }),
  c(9, 'কৃষ্ণচূড়া সরণিতে যান।', 'Advance to Krishnachura Avenue.', { type: 'advanceTo', space: 21 }),
  c(10, 'নিকটতম যানবাহন কেন্দ্রে যান।', 'Advance to the nearest transport hub.', { type: 'nearestTransport' }),
  c(11, 'জেল থেকে মুক্তির কার্ড। প্রয়োজনে ব্যবহার করুন।', 'Jail release card. Keep it until needed.', { type: 'jailFreeCard' }),
  c(12, 'ব্যবসায় দারুণ লাভ! ৳1,500 পান।', 'Great business profit! Receive ৳1,500.', { type: 'gain', amount: 1500 }),
  c(13, 'বন্ধুদের চা খাওয়ালেন। প্রত্যেককে ৳250 দিন।', 'You treated friends to tea. Pay each player ৳250.', { type: 'payEach', amount: 250 }),
  c(14, 'শান্তিনগরে যান।', 'Advance to Shantinagar.', { type: 'advanceTo', space: 8 }),
  c(15, 'শেয়ার বাজারে লাভ। ৳1,000 পান।', 'Stock market gain. Receive ৳1,000.', { type: 'gain', amount: 1000 }),
  c(16, 'ভাড়া নিয়ে ঝগড়া, জরিমানা ৳200।', 'Fare dispute fine: pay ৳200.', { type: 'pay', amount: 200 }),
  c(17, 'ভবন মেরামত: প্রতি বাড়ি ৳250, প্রতি হোটেল ৳1,000 দিন।', 'Building repairs: pay ৳250 per house and ৳1,000 per hotel.', { type: 'repairs', perHouse: 250, perHotel: 1000 }),
  c(18, 'বিমানবন্দরে যান।', 'Advance to the Airport.', { type: 'advanceTo', space: 35 }),
  c(19, 'মোবাইল ব্যাংকিং ক্যাশব্যাক! ৳250 পান।', 'Mobile banking cashback! Receive ৳250.', { type: 'gain', amount: 250 }),
  c(20, 'মানিব্যাগ হারিয়েছেন। ৳400 হারালেন।', 'You lost your wallet. Lose ৳400.', { type: 'pay', amount: 400 }),
];
