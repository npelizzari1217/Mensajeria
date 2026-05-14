/**
 * SearchQueryDTO — query parameters for GET /v1/messages/search.
 *
 * q: search query string (min 2, max 200 chars).
 * page: 1-indexed page number (default 1).
 * pageSize: items per page (default 20, max 100).
 */
export interface SearchQueryDTO {
  q: string;
  page?: string;
  pageSize?: string;
}
