import { IVideoRepository } from '@core/video/domain/video.repository';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { VideoId } from '@core/video/domain/video.aggregate';

export class DeleteVideoUseCase
  implements IUseCase<DeleteVideoInput, DeleteVideoOutput>
{
  constructor(private videoRepository: IVideoRepository) {}

  async execute(input: DeleteVideoInput): Promise<DeleteVideoOutput> {
    const videoId = new VideoId(input.id);
    await this.videoRepository.delete(videoId);
  }
}

export type DeleteVideoInput = {
  id: string;
};

type DeleteVideoOutput = void;
