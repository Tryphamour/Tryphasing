import { ViewerService } from '../../src/services/viewer.service';
import { ViewerRepository } from '../../src/repositories/viewer.repository';
import { Viewer, Prisma } from '@prisma/client';

// Mock the ViewerRepository with proper Jest mock types
const mockViewerRepository = {
  create: jest.fn<Promise<Viewer>, [Prisma.ViewerCreateInput]>(),
  findByTwitchId: jest.fn<Promise<Viewer | null>, [string]>(),
  findById: jest.fn<Promise<Viewer | null>, [string]>(),
  update: jest.fn<Promise<Viewer>, [string, Prisma.ViewerUpdateInput]>(),
  findAll: jest.fn<Promise<Viewer[]>, []>(),
};

describe('ViewerService', () => {
  let viewerService: ViewerService;

  beforeEach(() => {
    viewerService = new ViewerService(mockViewerRepository as unknown as ViewerRepository);
    jest.clearAllMocks();
  });

  const mockViewer: Viewer = {
    id: 'viewer123',
    twitchId: 'twitch123',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // --- findOrCreateViewer tests ---
  it('should create a new viewer if not found', async () => {
    mockViewerRepository.findByTwitchId.mockResolvedValue(null);
    mockViewerRepository.create.mockResolvedValue(mockViewer);

    const result = await viewerService.findOrCreateViewer('twitch123', 'testuser');

    expect(result).toEqual(mockViewer);
    expect(mockViewerRepository.findByTwitchId).toHaveBeenCalledWith('twitch123');
    expect(mockViewerRepository.create).toHaveBeenCalledWith({
      twitchId: 'twitch123',
      username: 'testuser',
    });
    expect(mockViewerRepository.update).not.toHaveBeenCalled();
  });

  it('should find an existing viewer if found', async () => {
    mockViewerRepository.findByTwitchId.mockResolvedValue(mockViewer);

    const result = await viewerService.findOrCreateViewer('twitch123', 'testuser');

    expect(result).toEqual(mockViewer);
    expect(mockViewerRepository.findByTwitchId).toHaveBeenCalledWith('twitch123');
    expect(mockViewerRepository.create).not.toHaveBeenCalled();
    expect(mockViewerRepository.update).not.toHaveBeenCalled();
  });

  it('should update username if viewer exists and username has changed', async () => {
    const oldUsernameViewer = { ...mockViewer, username: 'olduser' };
    const updatedViewer = { ...mockViewer, username: 'newuser' };
    mockViewerRepository.findByTwitchId.mockResolvedValue(oldUsernameViewer);
    mockViewerRepository.update.mockResolvedValue(updatedViewer);

    const result = await viewerService.findOrCreateViewer('twitch123', 'newuser');

    expect(result).toEqual(updatedViewer);
    expect(mockViewerRepository.findByTwitchId).toHaveBeenCalledWith('twitch123');
    expect(mockViewerRepository.create).not.toHaveBeenCalled();
    expect(mockViewerRepository.update).toHaveBeenCalledWith(mockViewer.id, { username: 'newuser' });
  });

  // --- findByTwitchId tests ---
  it('should return a viewer by twitchId', async () => {
    mockViewerRepository.findByTwitchId.mockResolvedValue(mockViewer);

    const result = await viewerService.findByTwitchId('twitch123');

    expect(result).toEqual(mockViewer);
    expect(mockViewerRepository.findByTwitchId).toHaveBeenCalledWith('twitch123');
  });

  it('should return null if viewer not found by twitchId', async () => {
    mockViewerRepository.findByTwitchId.mockResolvedValue(null);

    const result = await viewerService.findByTwitchId('nonexistent');

    expect(result).toBeNull();
  });

  // --- findViewerById tests ---
  it('should return a viewer by id', async () => {
    mockViewerRepository.findById.mockResolvedValue(mockViewer);

    const result = await viewerService.findViewerById('viewer123');

    expect(result).toEqual(mockViewer);
    expect(mockViewerRepository.findById).toHaveBeenCalledWith('viewer123');
  });

  it('should return null if viewer not found by id', async () => {
    mockViewerRepository.findById.mockResolvedValue(null);

    const result = await viewerService.findViewerById('nonexistent');

    expect(result).toBeNull();
  });

  // --- findAllViewers tests ---
  it('should return all viewers', async () => {
    mockViewerRepository.findAll.mockResolvedValue([mockViewer]);

    const result = await viewerService.findAllViewers();

    expect(result).toEqual([mockViewer]);
    expect(mockViewerRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
