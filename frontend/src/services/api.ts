const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/admin';

// Rarity enum - duplicated from backend for frontend use
export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  SUPER_RARE = 'SUPER_RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  LEGENDARY_ALT = 'LEGENDARY_ALT',
}

export interface Set { // Exporting Set interface
  id: string;
  name: string;
  image: string;
  totalCards: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateSetPayload {
  name: string;
  image: string;
}

export interface Card { // Exporting Card interface
  id: string;
  name: string;
  description?: string;
  image: string;
  rarity: Rarity;
  setId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCardPayload {
  name: string;
  description?: string;
  image: string;
  rarity: Rarity;
  setId: string;
}

export interface DropRate { // Exporting DropRate interface
  rarity: Rarity;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface FrontendPackOpeningResult { // New interface for frontend pack opening data
  requestId: string;
  viewer: { id: string; username: string };
  card: Card;
  stats: {
    distinctCardsInSet: number;
    totalDistinctCards: number;
  };
}


export const getSets = async (): Promise<Set[]> => {
  const response = await fetch(`${API_BASE_URL}/sets`);
  if (!response.ok) {
    throw new Error('Failed to fetch sets');
  }
  return response.json();
};

export const createSet = async (payload: CreateSetPayload): Promise<Set> => {
  const response = await fetch(`${API_BASE_URL}/sets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create set');
  }
  return response.json();
};

export const getCards = async (): Promise<Card[]> => {
  const response = await fetch(`${API_BASE_URL}/cards`);
  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }
  return response.json();
};

export const createCard = async (payload: CreateCardPayload): Promise<Card> => {
  const response = await fetch(`${API_BASE_URL}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create card');
  }
  return response.json();
};

export const getDropRates = async (): Promise<DropRate[]> => {
  const response = await fetch(`${API_BASE_URL}/drop-rates`);
  if (!response.ok) {
    throw new Error('Failed to fetch drop rates');
  }
  return response.json();
};

export const updateDropRate = async (rarity: Rarity, rate: number): Promise<DropRate> => {
  const response = await fetch(`${API_BASE_URL}/drop-rates/${rarity}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rate }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update drop rate');
  }
  return response.json();
};