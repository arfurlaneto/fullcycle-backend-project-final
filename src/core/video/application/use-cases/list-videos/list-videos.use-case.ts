import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../shared/application/pagination-output';
import {
  IVideoRepository,
  VideoSearchParams,
  VideoSearchResult,
} from '../../../domain/video.repository';
import { ICategoryRepository } from '../../../../category/domain/category.repository';
import { ListVideosInput } from './list-videos.input';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { CategoryId } from '../../../../category/domain/category.aggregate';
import { VideoOutput, VideoOutputMapper } from '../common/video-output';
import { IGenreRepository } from '@core/genre/domain/genre.repository';
import { ICastMemberRepository } from '@core/cast-member/domain/cast-member.repository';
import { GenreId } from '@core/genre/domain/genre.aggregate';
import { CastMemberId } from '@core/cast-member/domain/cast-member.aggregate';

export class ListVideosUseCase
  implements IUseCase<ListVideosInput, ListVideosOutput>
{
  constructor(
    private videoRepo: IVideoRepository,
    private categoryRepo: ICategoryRepository,
    private genreRepo: IGenreRepository,
    private castMemberRepo: ICastMemberRepository,
  ) {}

  async execute(input: ListVideosInput): Promise<ListVideosOutput> {
    const params = VideoSearchParams.create(input);
    const searchResult = await this.videoRepo.search(params);
    return this.toOutput(searchResult);
  }

  private async toOutput(
    searchResult: VideoSearchResult,
  ): Promise<ListVideosOutput> {
    const { items: _items } = searchResult;

    const genresIds = searchResult.items.reduce<GenreId[]>(
      (acc, item) => { return acc.concat([...item.genres_id.values()]); },
      [],
    );

    const genres = await this.genreRepo.findByIds(
      Array.from(genresIds),
    );

    const castMembersIds = searchResult.items.reduce<CastMemberId[]>(
      (acc, item) => { return acc.concat([...item.cast_members_id.values()]); },
      [],
    );

    const castMembers = await this.castMemberRepo.findByIds(
      Array.from(castMembersIds),
    );

    const videoCategoriesIds = searchResult.items.reduce<CategoryId[]>(
      (acc, item) => { 
        return acc.concat([...item.categories_id.values()]); 
      },
      [],
    );

    const genreCategoriesIds = genres.reduce<CategoryId[]>(
      (acc, item) => { 
        return acc.concat([...item.categories_id.values()]); 
      },
      [],
    );

    const categories = await this.categoryRepo.findByIds(
      Array.from([...videoCategoriesIds, ...genreCategoriesIds]),
    );

    const items = _items.map((i) => {
      return VideoOutputMapper.toOutput({
        video: i,
        allCategoriesOfVideoAndGenre: categories,
        genres: genres,
        cast_members: castMembers
      });
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListVideosOutput = PaginationOutput<VideoOutput>;
