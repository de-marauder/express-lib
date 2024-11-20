
export interface PaginationResponseDto<T> {
  limit: number;
  nextPage: number | null;
  currentPage: number;
  totalNumberOfItems: number;
  foundItems: T[];
}
export interface PaginationDto {
  limit: number;
  page: number;
}
