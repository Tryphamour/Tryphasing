import prisma from './prisma.client';
import { Set, Prisma } from '@prisma/client';

export class SetRepository {
  async create(data: Prisma.SetCreateInput): Promise<Set> {
    return prisma.set.create({ data });
  }

  async findAll(): Promise<Set[]> {
    return prisma.set.findMany();
  }

  async findById(id: string): Promise<Set | null> {
    return prisma.set.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.SetUpdateInput): Promise<Set> {
    return prisma.set.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Set> {
    return prisma.set.delete({ where: { id } });
  }
}
