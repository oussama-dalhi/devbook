export type Post = {
  id: number;
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    name: string;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PostsResponse = {
  posts: Post[];
  pagination: Pagination;
};
