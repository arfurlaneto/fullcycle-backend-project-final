import { VideoInMemoryRepository } from '@core/video/infra/db/in-memory/video-in-memory.repository';
import { Category } from '../../../../../category/domain/category.aggregate';
import { CategoryInMemoryRepository } from '../../../../../category/infra/db/in-memory/category-in-memory.repository';
import { ListVideosUseCase } from '../list-videos.use-case';
import { CastMemberInMemoryRepository } from '@core/cast-member/infra/db/in-memory/cast-member-in-memory.repository';
import { GenreInMemoryRepository } from '@core/genre/infra/db/in-memory/genre-in-memory.repository';
import { VideoSearchResult } from '@core/video/domain/video.repository';
import { Video } from '@core/video/domain/video.aggregate';
import { CastMember } from '@core/cast-member/domain/cast-member.aggregate';
import { Genre } from '@core/genre/domain/genre.aggregate';
import { VideoOutputMapper } from '../../common/video-output';
import { SortDirection } from '@core/shared/domain/repository/search-params';

describe('ListVideosUseCase Unit Tests', () => {
  let useCase: ListVideosUseCase;
  let videoRepo: VideoInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let genreRepo: GenreInMemoryRepository;
  let castMemberRepo: CastMemberInMemoryRepository;

  beforeEach(() => {
    videoRepo = new VideoInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    genreRepo = new GenreInMemoryRepository();
    castMemberRepo = new CastMemberInMemoryRepository();
    useCase = new ListVideosUseCase(
      videoRepo,
      categoryRepo,
      genreRepo,
      castMemberRepo,
    );
  });

  test('toOutput method', async () => {
    let result = new VideoSearchResult({
      items: [],
      total: 1,
      current_page: 1,
      per_page: 2,
    });
    let output = await useCase['toOutput'](result);
    expect(output).toStrictEqual({
      items: [],
      total: 1,
      current_page: 1,
      per_page: 2,
      last_page: 1,
    });

    const categories = Category.fake().theCategories(3).build();
    categoryRepo.bulkInsert(categories);

    const castMembers = CastMember.fake().theActors(2).build();
    castMemberRepo.bulkInsert(castMembers);

    const genres = Genre.fake().theGenres(2).build();
    genreRepo.bulkInsert(genres);

    const video = Video.fake()
      .aVideoWithoutMedias()
      .addCategoryId(categories[0].category_id)
      .addCategoryId(categories[1].category_id)
      .addCastMemberId(castMembers[0].cast_member_id)
      .addCastMemberId(castMembers[1].cast_member_id)
      .addGenreId(genres[0].genre_id)
      .addGenreId(genres[1].genre_id)
      .build();

    result = new VideoSearchResult({
      items: [video],
      total: 1,
      current_page: 1,
      per_page: 2,
    });

    output = await useCase['toOutput'](result);
    expect(output).toStrictEqual({
      items: [
        {
          id: video.video_id.id,
          title: video.title,
          description: video.description,
          year_launched: video.year_launched,
          duration: video.duration,
          rating: video.rating.value,
          is_opened: video.is_opened,
          is_published: video.is_published,
          categories: [
            {
              id: categories[0].category_id.id,
              name: categories[0].name,
              created_at: categories[0].created_at,
            },
            {
              id: categories[1].category_id.id,
              name: categories[1].name,
              created_at: categories[1].created_at,
            },
          ],
          categories_id: [
            categories[0].category_id.id,
            categories[1].category_id.id,
          ],
          cast_members: [
            {
              id: castMembers[0].cast_member_id.id,
              name: castMembers[0].name,
              created_at: castMembers[0].created_at,
              type: castMembers[0].type.type,
            },
            {
              id: castMembers[1].cast_member_id.id,
              name: castMembers[1].name,
              created_at: castMembers[1].created_at,
              type: castMembers[1].type.type,
            },
          ],
          cast_members_id: [
            castMembers[0].cast_member_id.id,
            castMembers[1].cast_member_id.id,
          ],
          genres: [
            {
              id: genres[0].genre_id.id,
              is_active: genres[0].is_active,
              name: genres[0].name,
              categories_id: Array.from(
                genres[0].categories_id,
                ([, value]) => value.id,
              ),
              categories: [],
              created_at: genres[0].created_at,
            },
            {
              id: genres[1].genre_id.id,
              is_active: genres[1].is_active,
              name: genres[1].name,
              categories_id: Array.from(
                genres[1].categories_id,
                ([, value]) => value.id,
              ),
              categories: [],
              created_at: genres[1].created_at,
            },
          ],
          genres_id: [genres[0].genre_id.id, genres[1].genre_id.id],
          created_at: video.created_at,
        },
      ],
      total: 1,
      current_page: 1,
      per_page: 2,
      last_page: 1,
    });
  });

  it('should search sorted by created_at when input param is empty', async () => {
    const categories = Category.fake().theCategories(3).build();
    categoryRepo.bulkInsert(categories);

    const castMembers = CastMember.fake().theActors(2).build();
    castMemberRepo.bulkInsert(castMembers);

    const genres = Genre.fake().theGenres(2).build();
    genreRepo.bulkInsert(genres);

    const videos = [
      Video.fake()
        .aVideoWithoutMedias()
        .addCategoryId(categories[0].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
      Video.fake()
        .aVideoWithoutMedias()
        .addCategoryId(categories[1].category_id)
        .addCastMemberId(castMembers[1].cast_member_id)
        .addGenreId(genres[1].genre_id)
        .withCreatedAt(new Date(new Date().getTime() + 100))
        .build(),
    ];
    await videoRepo.bulkInsert(videos);

    const output = await useCase.execute({});
    expect(output).toStrictEqual({
      items: [
               VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
               VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
      ],
      total: 2,
      current_page: 1,
      per_page: 15,
      last_page: 1,
    });
  });

  it('should search applying paginate and filter by categories_id', async () => {
    const categories = Category.fake().theCategories(4).build();
    await categoryRepo.bulkInsert(categories);

    const castMembers = CastMember.fake().theActors(2).build();
    castMemberRepo.bulkInsert(castMembers);

    const genres = Genre.fake().theGenres(2).build();
    genreRepo.bulkInsert(genres);

    const created_at = new Date();
    const videos = [
      Video.fake()
        .aVideoWithoutMedias()
        .addCategoryId(categories[0].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .withCreatedAt(created_at)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .addCategoryId(categories[0].category_id)
        .addCategoryId(categories[1].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .withCreatedAt(created_at)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .addCategoryId(categories[0].category_id)
        .addCategoryId(categories[1].category_id)
        .addCategoryId(categories[2].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .withCreatedAt(created_at)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .addCategoryId(categories[3].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .withCreatedAt(created_at)
        .build(),
    ];
    await videoRepo.bulkInsert(videos);

     const arrange = [
       {
        input: {
          page: 1,
          per_page: 2,
          filter: { categories_id: [categories[0].category_id.id] },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          filter: { categories_id: [categories[0].category_id.id] },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          filter: {
            categories_id: [
              categories[0].category_id.id,
              categories[1].category_id.id,
            ],
          },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          filter: {
            categories_id: [
              categories[0].category_id.id,
              categories[1].category_id.id,
            ],
          },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          filter: {
            categories_id: [
              categories[1].category_id.id,
              categories[2].category_id.id,
            ],
          },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),            
          ],
          total: 2,
          current_page: 1,
          per_page: 2,
          last_page: 1,
        },
      },
    ];

     for (const item of arrange) {
       const output = await useCase.execute(item.input);
       expect(output).toStrictEqual(item.output);
     }
  });

  it('should search applying paginate and sort', async () => {
    const categories = Category.fake().theCategories(6).build();
    await categoryRepo.bulkInsert(categories);

    const castMembers = CastMember.fake().theActors(2).build();
    await castMemberRepo.bulkInsert(castMembers);

    const genres = Genre.fake().theGenres(2).build();
    await genreRepo.bulkInsert(genres);

    const videos = [
      Video.fake()
        .aVideoWithoutMedias()
        .withTitle('b')
        .addCategoryId(categories[0].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .withTitle('a')
        .addCategoryId(categories[1].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .withTitle('d')
        .addCategoryId(categories[2].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .withTitle('e')
        .addCategoryId(categories[3].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
        Video.fake()
        .aVideoWithoutMedias()
        .withTitle('c')
        .addCategoryId(categories[4].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
    ];
    await videoRepo.bulkInsert(videos);

    const arrange = [
      {
        input: {
          page: 1,
          per_page: 2,
          sort: 'title',
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 5,
          current_page: 1,
          per_page: 2,
          last_page: 3,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: 'title',
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[4], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 5,
          current_page: 2,
          per_page: 2,
          last_page: 3,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: 'title',
          sort_dir: 'desc' as SortDirection,
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[3], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 5,
          current_page: 1,
          per_page: 2,
          last_page: 3,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: 'title',
          sort_dir: 'desc' as SortDirection,
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[4], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 5,
          current_page: 2,
          per_page: 2,
          last_page: 3,
        },
      },
    ];

    for (const item of arrange) {
      const output = await useCase.execute(item.input);
      expect(output).toStrictEqual(item.output);
    }
  });

  describe('should search applying filter by categories_id, sort and paginate', () => {
    const categories = Category.fake().theCategories(4).build();
    const castMembers = CastMember.fake().theActors(2).build();
    const genres = Genre.fake().theGenres(2).build();
    const videos = [
      Video.fake()
        .aVideoWithoutMedias()
        .withTitle('test')
        .addCategoryId(categories[0].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
      Video.fake()
        .aVideoWithoutMedias()
        .withTitle('a')
        .addCategoryId(categories[0].category_id)
        .addCategoryId(categories[1].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
      Video.fake()
        .aVideoWithoutMedias()
        .withTitle('TEST')
        .addCategoryId(categories[0].category_id)
        .addCategoryId(categories[1].category_id)
        .addCategoryId(categories[2].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
      Video.fake()
        .aVideoWithoutMedias()
        .withTitle('e')
        .addCategoryId(categories[3].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
      Video.fake()
        .aVideoWithoutMedias()
        .withTitle('TeSt')
        .addCategoryId(categories[1].category_id)
        .addCategoryId(categories[2].category_id)
        .addCastMemberId(castMembers[0].cast_member_id)
        .addGenreId(genres[0].genre_id)
        .build(),
  ];

  const arrange = [
      {
        input: {
          page: 1,
          per_page: 2,
          sort: 'title',
          filter: { categories_id: [categories[0].category_id.id] },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: 'title',
          filter: { categories_id: [categories[0].category_id.id] },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: 'title',
          filter: { categories_id: [categories[1].category_id.id] },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[4], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: 'title',
          filter: { categories_id: [categories[1].category_id.id] },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 3,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 1,
          per_page: 2,
          sort: 'title',
          filter: {
            categories_id: [
              categories[0].category_id.id,
              categories[1].category_id.id,
            ],
          },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[2], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[4], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 4,
          current_page: 1,
          per_page: 2,
          last_page: 2,
        },
      },
      {
        input: {
          page: 2,
          per_page: 2,
          sort: 'title',
          filter: {
            categories_id: [
              categories[0].category_id.id,
              categories[1].category_id.id,
            ],
          },
        },
        output: {
          items: [
            VideoOutputMapper.toOutput({video: videos[1], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
            VideoOutputMapper.toOutput({video: videos[0], allCategoriesOfVideoAndGenre: categories, genres, cast_members: castMembers}),
          ],
          total: 4,
          current_page: 2,
          per_page: 2,
          last_page: 2,
        },
      },
    ];

    beforeEach(async () => {
      await categoryRepo.bulkInsert(categories);
      await castMemberRepo.bulkInsert(castMembers);
      await genreRepo.bulkInsert(genres);
      await videoRepo.bulkInsert(videos)
    });

    test.each(arrange)(
      'when input is {"filter": $input.filter, "page": $input.page, "per_page": $input.per_page, "sort": $input.sort, "sort_dir": $input.sort_dir}',
      async ({ input, output: expectedOutput }) => {
        const output = await useCase.execute(input);
        expect(output).toStrictEqual(expectedOutput);
      },
    );
  });
});
