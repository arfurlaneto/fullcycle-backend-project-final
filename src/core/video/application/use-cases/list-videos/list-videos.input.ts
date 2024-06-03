import { SearchInput } from '../../../../shared/application/search-input';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { IsArray, IsUUID, ValidateNested, validateSync } from 'class-validator';

export class ListVideosFilter {
  @IsUUID('4', { each: true })
  @IsArray()
  categories_id?: string[];

  @IsUUID('4', { each: true })
  @IsArray()
  genres_id?: string[];

  @IsUUID('4', { each: true })
  @IsArray()
  cast_members_id?: string[];
}

export class ListVideosInput implements SearchInput<ListVideosFilter> {
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: SortDirection;
  @ValidateNested()
  filter?: ListVideosFilter;
}

export class ValidateListVideosInput {
  static validate(input: ListVideosInput) {
    return validateSync(input);
  }
}
