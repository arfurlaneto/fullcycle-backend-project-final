import { VideoInMemoryRepository } from '@core/video/infra/db/in-memory/video-in-memory.repository';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { DeleteVideoUseCase } from '../delete-video.use-case';
import { Video, VideoId } from '@core/video/domain/video.aggregate';

describe('DeleteVideoUseCase Unit Tests', () => {
  let useCase: DeleteVideoUseCase;
  let repository: VideoInMemoryRepository;

  beforeEach(() => {
    repository = new VideoInMemoryRepository();
    useCase = new DeleteVideoUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const videoId = new VideoId();

    await expect(() =>
      useCase.execute({ id: videoId.id }),
    ).rejects.toThrow(new NotFoundError(videoId.id, Video));
  });

  it('should delete a video', async () => {
    const items = [Video.fake().aVideoWithoutMedias().build()];
    repository.items = items;
    await useCase.execute({
      id: items[0].video_id.id,
    });
    expect(repository.items).toHaveLength(0);
  });
});
