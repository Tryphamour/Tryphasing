import prisma from './prisma.client';
import { Viewer, Prisma } from '@prisma/client';

export class ViewerRepository {
  async create(data: Prisma.ViewerCreateInput): Promise<Viewer> {
    return prisma.viewer.create({ data });
  }

  async findAll(): Promise<Viewer[]> {
    return prisma.viewer.findMany();
  }

  async findById(id: string): Promise<Viewer | null> {
    return prisma.viewer.findUnique({ where: { id } });
  }

  async findByTwitchId(twitchId: string): Promise<Viewer | null> {
    return prisma.viewer.findUnique({ where: { twitchId } });
  }

  async update(id: string, data: Prisma.ViewerUpdateInput): Promise<Viewer> {
    return prisma.viewer.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Viewer> {
    return prisma.viewer.delete({ where: { id } });
  }
}
