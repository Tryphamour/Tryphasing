import prisma from './prisma.client';
import { Collection, Prisma } from '@prisma/client';

export class CollectionRepository {
  async create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return prisma.collection.create({ data });
  }

  async findAll(): Promise<Collection[]> {
    return prisma.collection.findMany();
  }

  async findById(id: string): Promise<Collection | null> {
    return prisma.collection.findUnique({ where: { id } });
  }

  async findByViewerAndCard(viewerId: string, cardId: string): Promise<Collection | null> {
    return prisma.collection.findUnique({
      where: {
        viewerId_cardId: {
          viewerId,
          cardId,
        },
      },
    });
  }

  async update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return prisma.collection.update({ where: { id }, data });
  }

  async upsert(viewerId: string, cardId: string, quantityChange: number): Promise<Collection> {
    return prisma.collection.upsert({
      where: {
        viewerId_cardId: {
          viewerId,
          cardId,
        },
      },
      update: {
        quantity: {
          increment: quantityChange,
        },
      },
      create: {
        viewerId,
        cardId,
        quantity: quantityChange,
      },
    });
  }

  async delete(id: string): Promise<Collection> {
    return prisma.collection.delete({ where: { id } });
  }

  // New method for getting distinct cards in a collection by viewerId
  async findManyDistinctByViewerId(viewerId: string): Promise<Collection[]> {
    return prisma.collection.findMany({
      where: { viewerId },
      distinct: ['cardId'],
    });
  }

  // New method for getting distinct cards in a collection by viewerId and specific cardIds
  async findManyDistinctByViewerIdAndCardIds(viewerId: string, cardIds: string[]): Promise<Collection[]> {
    return prisma.collection.findMany({
      where: {
        viewerId,
        cardId: { in: cardIds },
      },
      distinct: ['cardId'],
    });
  }
}