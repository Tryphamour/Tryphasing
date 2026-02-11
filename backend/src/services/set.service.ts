import { Set, Prisma } from '@prisma/client';
import { SetRepository } from '../repositories/set.repository';
import { CardRepository } from '../repositories/card.repository'; // To check for associated cards

export class SetService {
  private setRepository: SetRepository;
  private cardRepository: CardRepository; // Inject CardRepository to check for associated cards

  constructor(setRepository: SetRepository, cardRepository: CardRepository) {
    this.setRepository = setRepository;
    this.cardRepository = cardRepository;
  }

  async createSet(data: Prisma.SetCreateInput): Promise<Set> {
    return this.setRepository.create(data);
  }

  async findAllSets(): Promise<Set[]> {
    return this.setRepository.findAll();
  }

  async findSetById(id: string): Promise<Set | null> {
    return this.setRepository.findById(id);
  }

  async updateSet(id: string, data: Prisma.SetUpdateInput): Promise<Set> {
    return this.setRepository.update(id, data);
  }

  async deleteSet(id: string): Promise<Set> {
    // Before deleting a set, check if there are any cards associated with it
    const associatedCards = await this.cardRepository.findAll(); // More efficient: find cards by setId
    const cardsInSet = associatedCards.filter(card => card.setId === id);

    if (cardsInSet.length > 0) {
      throw new Error(`Cannot delete Set with ID ${id} because it still contains ${cardsInSet.length} associated cards.`);
    }
    return this.setRepository.delete(id);
  }
}
