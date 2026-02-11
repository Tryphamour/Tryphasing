import { Viewer, Prisma } from '@prisma/client';
import { ViewerRepository } from '../repositories/viewer.repository';

export class ViewerService {
  private viewerRepository: ViewerRepository;

  constructor(viewerRepository: ViewerRepository) {
    this.viewerRepository = viewerRepository;
  }

  async findOrCreateViewer(twitchId: string, username: string): Promise<Viewer> {
    let viewer = await this.viewerRepository.findByTwitchId(twitchId);

    if (!viewer) {
      viewer = await this.viewerRepository.create({
        twitchId,
        username,
      });
    } else if (viewer.username !== username) {
      // Update username if it has changed
      viewer = await this.viewerRepository.update(viewer.id, { username });
    }

    return viewer;
  }

  async findByTwitchId(twitchId: string): Promise<Viewer | null> {
    return this.viewerRepository.findByTwitchId(twitchId);
  }

  async findViewerById(id: string): Promise<Viewer | null> {
    return this.viewerRepository.findById(id);
  }

  async findAllViewers(): Promise<Viewer[]> {
    return this.viewerRepository.findAll();
  }

  // Potentially more methods like getViewerCollectionSummary, etc.
}
