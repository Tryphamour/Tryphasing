import prisma from './prisma.client';
import { Card, Prisma } from '@prisma/client';

export class CardRepository {
  async create(data: Prisma.CardCreateInput): Promise<Card> {
    return prisma.card.create({ data });
  }

  async findAll(): Promise<Card[]> {
    return prisma.card.findMany();
  }

  async findById(id: string): Promise<Card | null> {
    return prisma.card.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.CardUpdateInput): Promise<Card> {
    return prisma.card.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Card> {
    return prisma.card.delete({ where: { id } });
  }
}
