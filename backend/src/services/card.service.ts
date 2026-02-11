import { Card, Prisma, Rarity } from '@prisma/client';
import { CardRepository } from '../repositories/card.repository';
import { SetRepository } from '../repositories/set.repository';

// Custom input types for the service layer
interface CreateCardServiceInput {
  name: string;
  description?: string;
  image: string;
  rarity: Rarity;
  setId: string; // Explicitly required for service input
}

interface UpdateCardServiceInput {
  name?: string;
  description?: string;
  image?: string;
  rarity?: Rarity;
  setId?: string; // Optional for service input
}

export class CardService {
  private cardRepository: CardRepository;
  private setRepository: SetRepository;

  constructor(cardRepository: CardRepository, setRepository: SetRepository) {
    this.cardRepository = cardRepository;
    this.setRepository = setRepository;
  }

  async createCard(input: CreateCardServiceInput): Promise<Card> {
    const { setId, ...cardData } = input;

    // Validate if the set exists
    const existingSet = await this.setRepository.findById(setId);
    if (!existingSet) {
      throw new Error(`Set with ID ${setId} not found.`);
    }

    // Transform input to Prisma.CardCreateInput
    const prismaData: Prisma.CardCreateInput = {
      ...cardData,
      set: {
        connect: { id: setId },
      },
    };
    return this.cardRepository.create(prismaData);
  }

  async findAllCards(): Promise<Card[]> {
    return this.cardRepository.findAll();
  }

  async findCardById(id: string): Promise<Card | null> {
    return this.cardRepository.findById(id);
  }

  async updateCard(id: string, input: UpdateCardServiceInput): Promise<Card> {
    const { setId, ...cardData } = input;
    const prismaData: Prisma.CardUpdateInput = { ...cardData };

    // If setId is provided in the update, validate and transform it
    if (setId) {
      const existingSet = await this.setRepository.findById(setId);
      if (!existingSet) {
        throw new Error(`Set with ID ${setId} not found.`);
      }
      prismaData.set = {
        connect: { id: setId },
      };
    }

    return this.cardRepository.update(id, prismaData);
  }

  async deleteCard(id: string): Promise<Card> {
    return this.cardRepository.delete(id);
  }
}