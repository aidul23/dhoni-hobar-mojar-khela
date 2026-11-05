export type Lang = 'bn' | 'en';

export type ColorGroup =
  | 'brown'
  | 'sky'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'navy'
  | 'transport'
  | 'utility';

export type PropertyKind = 'street' | 'transport' | 'utility';

/** Static, never-changing definition of a purchasable space. */
export interface PropertyDef {
  id: string;
  nameBn: string;
  nameEn: string;
  kind: PropertyKind;
  group: ColorGroup;
  price: number;
  /** [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]. Unused for transport/utility. */
  rents: [number, number, number, number, number, number];
  houseCost: number;
  mortgageValue: number;
}

export type SpaceType =
  | 'start'
  | 'property'
  | 'tax'
  | 'chance'
  | 'fortune'
  | 'jail'
  | 'rest'
  | 'goToJail';

export interface SpaceDef {
  index: number;
  type: SpaceType;
  nameBn: string;
  nameEn: string;
  propertyId?: string;
  taxAmount?: number;
}

/** Mutable per-game state of a property. */
export interface PropertyState {
  ownerId: string | null;
  houses: number;
  hotel: boolean;
  mortgaged: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  token: string;
  position: number;
  cash: number;
  properties: string[];
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  bankrupt: boolean;
}

export type GameMode = 'classic' | 'fast' | 'custom';

export interface GameSettings {
  mode: GameMode;
  startingCash: number;
  startBonus: number;
  jailFine: number;
  /** Multiplier applied to property purchase prices. */
  priceMultiplier: number;
  /** Win instantly by owning this % of all properties. null = disabled. */
  victoryPercent: number | null;
  /** Game ends after this many full rounds; richest player wins. null = no limit. */
  turnLimit: number | null;
  /** Houses/hotels available in the bank. null = unlimited. */
  houseLimit: number | null;
  hotelLimit: number | null;
}

export type DeckType = 'chance' | 'fortune';

export type CardEffect =
  | { type: 'gain'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'move'; steps: number }
  | { type: 'advanceTo'; space: number }
  | { type: 'nearestTransport' }
  | { type: 'goToJail' }
  | { type: 'jailFreeCard' }
  | { type: 'collectFromEach'; amount: number }
  | { type: 'payEach'; amount: number }
  | { type: 'repairs'; perHouse: number; perHotel: number };

export interface Card {
  id: string;
  deck: DeckType;
  bn: string;
  en: string;
  effect: CardEffect;
}

export interface PlayerStats {
  rentPaid: number;
  rentReceived: number;
  taxesPaid: number;
  propertiesBought: number;
  housesBuilt: number;
  hotelsBuilt: number;
  passedStart: number;
  jailVisits: number;
  doublesRolled: number;
  cardsDrawn: number;
  tradesCompleted: number;
  turnsPlayed: number;
}

/** What a payment was for; used for statistics. */
export type ChargeReason = 'rent' | 'tax' | 'other';

export type WinReason = 'lastStanding' | 'ownership' | 'turnLimit';

/** Money a player owes but could not pay yet. Resolved before play continues. */
export interface Debt {
  debtorId: string;
  /** null = owed to the bank. */
  creditorId: string | null;
  amount: number;
  reason: ChargeReason;
}

export interface TradeOffer {
  fromId: string;
  toId: string;
  offerCash: number;
  offerProperties: string[];
  requestCash: number;
  requestProperties: string[];
}

export type GamePhase = 'roll' | 'buy' | 'card' | 'end' | 'gameOver';

export type LogParams = Record<string, string | number>;

export interface LogEntry {
  id: number;
  key: string;
  params: LogParams;
}

export interface GameState {
  version: number;
  settings: GameSettings;
  players: Player[];
  currentPlayerIndex: number;
  properties: Record<string, PropertyState>;
  phase: GamePhase;
  dice: [number, number] | null;
  doublesCount: number;
  /** True when the current player rolled doubles and may roll again. */
  canRollAgain: boolean;
  pendingPurchase: string | null;
  pendingCard: { deck: DeckType; cardId: string } | null;
  chanceDeck: string[];
  fortuneDeck: string[];
  log: LogEntry[];
  /** Latest important message (rent paid, tax, ...) shown as a toast. */
  notice: LogEntry | null;
  nextLogId: number;
  turnNumber: number;
  winnerId: string | null;
  /** Queue of unpaid debts; the first one must be settled before anything else. */
  debts: Debt[];
  /** A trade proposal waiting for the other player's answer. */
  pendingTrade: TradeOffer | null;
  stats: Record<string, PlayerStats>;
  /** Player ids in the order they went bankrupt. */
  bankruptOrder: string[];
  /** Current round; increases each time play passes the first active seat again. */
  round: number;
  winReason: WinReason | null;
  /** Running totals of money the bank has taken in and paid out. */
  bank: { received: number; paid: number };
}

export type GameAction =
  | { type: 'ROLL'; dice: [number, number] }
  | { type: 'BUY' }
  | { type: 'DECLINE_BUY' }
  | { type: 'RESOLVE_CARD' }
  | { type: 'PAY_JAIL_FINE' }
  | { type: 'USE_JAIL_CARD' }
  | { type: 'END_TURN' }
  | { type: 'BUILD_HOUSE'; propertyId: string }
  | { type: 'BUILD_HOTEL'; propertyId: string }
  | { type: 'SELL_BUILDING'; propertyId: string }
  | { type: 'MORTGAGE'; propertyId: string }
  | { type: 'UNMORTGAGE'; propertyId: string }
  | { type: 'PROPOSE_TRADE'; offer: Omit<TradeOffer, 'fromId'> }
  | { type: 'ACCEPT_TRADE' }
  | { type: 'REJECT_TRADE' }
  | { type: 'PAY_DEBT' }
  | { type: 'DECLARE_BANKRUPTCY' }
  /** Server/host only: a player leaves the game; their assets return to the bank. */
  | { type: 'FORFEIT'; playerId: string };

export interface PlayerSetup {
  name: string;
  color: string;
  token: string;
}
