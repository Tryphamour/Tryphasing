import { DropRate, Prisma, Rarity } from '@prisma/client';
import { DropRateRepository } from '../repositories/drop-rate.repository';

export class DropRateService {
  private dropRateRepository: DropRateRepository;

  constructor(dropRateRepository: DropRateRepository) {
    this.dropRateRepository = dropRateRepository;
  }

  async findAllDropRates(): Promise<DropRate[]> {
    return this.dropRateRepository.findAll();
  }

  async updateDropRate(rarity: Rarity, newRate: number): Promise<DropRate> {
    // Basic validation for the new rate
    if (newRate < 0 || newRate > 1) {
      throw new Error('Drop rate must be between 0 and 1.');
    }

    // A more complex validation would involve checking the sum of all drop rates
    // after this update to ensure it doesn't exceed 1.
    // For now, we assume the admin interface will handle the overall balance
    // or this will be handled in a separate "balanceDropRates" function.
    // This method focuses on updating a single rate.

    const existingDropRate = await this.dropRateRepository.findByRarity(rarity);

    if (!existingDropRate) {
      // If a drop rate for this rarity doesn't exist, create it.
      // This might be more appropriate in a seeder or initial setup.
      // For an admin update, we expect it to exist.
      throw new Error(`Drop rate for rarity ${rarity} not found.`);
    }

    return this.dropRateRepository.update(rarity, { rate: newRate });
  }

  // Helper function to calculate total drop rate (for future use or external validation)
  async calculateTotalDropRate(): Promise<number> {
    const allRates = await this.dropRateRepository.findAll();
    return allRates.reduce((sum, dr) => sum + dr.rate, 0);
  }
}
