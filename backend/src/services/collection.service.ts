import { Collection, Card, Set, Prisma } from '@prisma/client';
import { CollectionRepository } from '../repositories/collection.repository';
import { CardRepository } from '../repositories/card.repository';
import { SetRepository } from '../repositories/set.repository';
// Removed direct import of prisma client as it will no longer be used here

export class CollectionService {
  private collectionRepository: CollectionRepository;
  private cardRepository: CardRepository;
  private setRepository: SetRepository;

  constructor(
    collectionRepository: CollectionRepository,
    cardRepository: CardRepository,
    setRepository: SetRepository,
  ) {
    this.collectionRepository = collectionRepository;
    this.cardRepository = cardRepository;
    this.setRepository = setRepository;
  }

  async addCardToCollection(viewerId: string, cardId: string, quantity: number = 1): Promise<Collection> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found.`);
    }
    // The upsert method in the repository handles creation or incrementing quantity
    return this.collectionRepository.upsert(viewerId, cardId, quantity);
  }

  // This method could be more complex if viewer's full collection data is needed,
  // but for distinct count, the repository methods are sufficient.
  async getViewerCollection(viewerId: string): Promise<Collection[]> {
    // This now returns collections with only cardId for distinct purposes, not full card object
    // If full card objects are needed, an include option would need to be added to findManyDistinct or a separate method.
    return this.collectionRepository.findManyDistinctByViewerId(viewerId);
  }

  async getDistinctCardsInSet(viewerId: string, setId: string): Promise<number> {
    const cardsInSet = await this.cardRepository.findAll(); // Still inefficient, to be improved by findBySetId on CardRepository
    const distinctCardIdsInSet = cardsInSet.filter(card => card.setId === setId).map(card => card.id);

    // Use the new repository method
    const viewerCollection = await this.collectionRepository.findManyDistinctByViewerIdAndCardIds(
      viewerId,
      distinctCardIdsInSet,
    );
    return viewerCollection.length;
  }

  async getTotalDistinctCards(viewerId: string): Promise<number> {
    // Use the new repository method
    const viewerCollection = await this.collectionRepository.findManyDistinctByViewerId(viewerId);
    return viewerCollection.length;
  }
}