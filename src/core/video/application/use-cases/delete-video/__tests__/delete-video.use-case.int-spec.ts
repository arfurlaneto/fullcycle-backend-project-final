import { DeleteVideoUseCase } from '../delete-video.use-case';
import { setupSequelize } from '../../../../../shared/infra/testing/helpers';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import {
  Video,
  VideoId,
} from '../../../../domain/video.aggregate';
import { VideoSequelizeRepository } from '../../../../infra/db/sequelize/video-sequelize.repository';
import { VideoCastMemberModel, VideoCategoryModel, VideoGenreModel, VideoModel } from '../../../../infra/db/sequelize/video.model';
import { UnitOfWorkSequelize } from '../../../../../shared/infra/db/sequelize/unit-of-work-sequelize';
import { setupSequelizeForVideo } from '../../../../infra/db/sequelize/testing/helpers';
import { ImageMediaModel } from '../../../../infra/db/sequelize/image-media.model';
import { AudioVideoMediaModel } from '../../../../infra/db/sequelize/audio-video-media.model';
import { CategoryModel } from '../../../../../category/infra/db/sequelize/category.model';
import { GenreCategoryModel, GenreModel } from '../../../../../genre/infra/db/sequelize/genre-model';
import { CastMemberModel, CastMemberSequelizeRepository } from '../../../../../cast-member/infra/db/sequelize/cast-member-sequelize';
import { ICategoryRepository } from '@core/category/domain/category.repository';
import { IGenreRepository } from '@core/genre/domain/genre.repository';
import { ICastMemberRepository } from '@core/cast-member/domain/cast-member.repository';
import { CategorySequelizeRepository } from '@core/category/infra/db/sequelize/category-sequelize.repository';
import { GenreSequelizeRepository } from '@core/genre/infra/db/sequelize/genre-sequelize.repository';
import { Category } from '@core/category/domain/category.aggregate';
import { Genre } from '@core/genre/domain/genre.aggregate';
import { CastMember } from '@core/cast-member/domain/cast-member.aggregate';

describe('DeleteVideoUseCase Integration Tests', () => {
  let useCase: DeleteVideoUseCase;
  let videoRepository: VideoSequelizeRepository;
  let categoryRepository: ICategoryRepository;
  let genreRepository: IGenreRepository;
  let castMemberRepository: ICastMemberRepository;
  let uow: UnitOfWorkSequelize;

  const sequelizeHelper = setupSequelizeForVideo();
  beforeEach(() => {
    uow = new UnitOfWorkSequelize(sequelizeHelper.sequelize);
    videoRepository = new VideoSequelizeRepository(VideoModel, uow);
    categoryRepository = new CategorySequelizeRepository(CategoryModel);
    genreRepository = new GenreSequelizeRepository(GenreModel, uow);
    castMemberRepository = new CastMemberSequelizeRepository(CastMemberModel);
    useCase = new DeleteVideoUseCase(videoRepository);
  });

  it('should throws error when entity not found', async () => {
    const videoId = new VideoId();
    await expect(() =>
      useCase.execute({ id: videoId.id }),
    ).rejects.toThrow(new NotFoundError(videoId.id, Video));
  });

  it('should delete a cast member', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepository.insert(category);
    const genre = Genre.fake()
      .aGenre()
      .addCategoryId(category.category_id)
      .build();
    await genreRepository.insert(genre);
    const castMember = CastMember.fake().anActor().build();
    await castMemberRepository.insert(castMember);
    const video = Video.fake()
      .aVideoWithoutMedias()
      .addCategoryId(category.category_id)
      .addGenreId(genre.genre_id)
      .addCastMemberId(castMember.cast_member_id)
      .build();

    await videoRepository.insert(video);

    await useCase.execute({
      id: video.video_id.id,
    });
    const noHasModel = await VideoModel.findByPk(
      video.video_id.id,
    );
    expect(noHasModel).toBeNull();
  });
});
