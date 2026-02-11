import { Card, Rarity, Set } from '@prisma/client';
import { CollectionService } from './collection.service';
import { DropRateService } from './drop-rate.service';
import { CardRepository } from '../repositories/card.repository';
import { SetRepository } from '../repositories/set.repository';
import { ViewerService } from './viewer.service'; // To validate viewer

export interface PackOpeningResult {
  openedCard: Card;
  distinctCardsInSet: number;
  totalDistinctCards: number;
}

export class PackOpeningService {
  private viewerService: ViewerService;
  private collectionService: CollectionService;
  private dropRateService: DropRateService;
  private cardRepository: CardRepository;
  private setRepository: SetRepository;

  constructor(
    viewerService: ViewerService,
    collectionService: CollectionService,
    dropRateService: DropRateService,
    cardRepository: CardRepository,
    setRepository: SetRepository,
  ) {
    this.viewerService = viewerService;
    this.collectionService = collectionService;
    this.dropRateService = dropRateService;
    this.cardRepository = cardRepository;
    this.setRepository = setRepository;
  }

  async openPack(viewerId: string, setId: string): Promise<PackOpeningResult> {
    // 1. Validate Viewer and Set
    const viewer = await this.viewerService.findViewerById(viewerId);
    if (!viewer) {
      throw new Error(`Viewer with ID ${viewerId} not found.`);
    }

    const set = await this.setRepository.findById(setId);
    if (!set) {
      throw new Error(`Set with ID ${setId} not found.`);
    }

    // 2. Determine Rarity based on Drop Rates
    const dropRates = await this.dropRateService.findAllDropRates();
    const droppedRarity = this.determineDroppedRarity(dropRates);

    if (!droppedRarity) {
      throw new Error('Could not determine a drop rarity. Check drop rate configuration.');
    }

    // 3. Select a Random Card of the Determined Rarity from the Set
    // This is currently inefficient: fetching all cards and then filtering.
    // Ideally, CardRepository should have a method to find cards by setId AND rarity.
    const allCards = await this.cardRepository.findAll();
    const eligibleCards = allCards.filter(
      (card) => card.setId === setId && card.rarity === droppedRarity,
    );

    if (eligibleCards.length === 0) {
      throw new Error(`No cards found for rarity ${droppedRarity} in Set ID ${setId}.`);
    }

    const randomIndex = Math.floor(Math.random() * eligibleCards.length);
    const openedCard = eligibleCards[randomIndex];

    // 4. Add Card to Viewer's Collection
    await this.collectionService.addCardToCollection(viewerId, openedCard.id);

    // 5. Get Updated Collection Statistics
    const distinctCardsInSet = await this.collectionService.getDistinctCardsInSet(viewerId, setId);
    const totalDistinctCards = await this.collectionService.getTotalDistinctCards(viewerId);

    return {
      openedCard,
      distinctCardsInSet,
      totalDistinctCards,
    };
  }

  private determineDroppedRarity(dropRates: { rarity: Rarity; rate: number }[]): Rarity | null {
    let totalProbability = 0;
    // Ensure total probability is 1 (or close to it) and rates are positive
    const validDropRates = dropRates.filter(dr => dr.rate > 0);
    totalProbability = validDropRates.reduce((sum, dr) => sum + dr.rate, 0);

    if (totalProbability <= 0) { // No valid drop rates
        return null;
    }

    // Normalize rates if they don't sum to 1 to ensure a consistent 100% chance to drop *something*
    const normalizedDropRates = validDropRates.map(dr => ({
        rarity: dr.rarity,
        rate: dr.rate / totalProbability
    }));

    const randomNumber = Math.random(); // A number between 0 (inclusive) and 1 (exclusive)
    let cumulativeProbability = 0;

    for (const dr of normalizedDropRates) {
      cumulativeProbability += dr.rate;
      if (randomNumber < cumulativeProbability) {
        return dr.rarity;
      }
    }

    // Fallback: This should ideally not be reached if totalProbability > 0 and randomNumber is between 0 and 1.
    // But as a safeguard, return the rarest card if something goes wrong.
    return normalizedDropRates.length > 0 ? normalizedDropRates[normalizedDropRates.length - 1].rarity : null;
  }
}
