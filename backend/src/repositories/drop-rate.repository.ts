import prisma from './prisma.client';
import { DropRate, Prisma, Rarity } from '@prisma/client';

export class DropRateRepository {
  async create(data: Prisma.DropRateCreateInput): Promise<DropRate> {
    return prisma.dropRate.create({ data });
  }

  async findAll(): Promise<DropRate[]> {
    return prisma.dropRate.findMany({
      orderBy: {
        // Order by Rarity enum for consistent drop rate calculation
        rarity: 'asc', // Or a custom order if needed
      },
    });
  }

  async findByRarity(rarity: Rarity): Promise<DropRate | null> {
    return prisma.dropRate.findUnique({ where: { rarity } });
  }

  async update(rarity: Rarity, data: Prisma.DropRateUpdateInput): Promise<DropRate> {
    return prisma.dropRate.update({ where: { rarity }, data });
  }

  async upsert(rarity: Rarity, rate: number): Promise<DropRate> {
    return prisma.dropRate.upsert({
      where: { rarity },
      update: { rate },
      create: { rarity, rate },
    });
  }

  async delete(rarity: Rarity): Promise<DropRate> {
    return prisma.dropRate.delete({ where: { rarity } });
  }
}
