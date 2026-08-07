export const BRAND = {
  name: 'DevFlow',
  sloganZh: '技术内容社区',
  sloganEn: 'Developer Content Community',
  primary: '#2F6BFF',
  accent: '#00C2A8',
  bg: '#F7F8FA',
  text: '#0F172A',
} as const

export type Locale = 'zh' | 'en'
export const LOCALES: Locale[] = ['zh', 'en']

export type Role = 'user' | 'admin'
export type ArticleStatus = 'draft' | 'published'
export type SortOrder = 'latest' | 'hot'

export interface Paginated<T> {
  items: T[]
  nextCursor: string | null
  total?: number
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiErrorBody {
  statusCode: number
  code: string
  message: string
  details?: unknown
}

export interface AuthorInfo {
  id: number
  username: string
  avatar: string | null
  bio: string | null
}

export interface TagDTO {
  id: number
  name: string
  slug: string
  articleCount?: number
}

export interface UserProfile {
  id: number
  username: string
  email?: string
  avatar: string | null
  bio: string | null
  role: Role
  locale: Locale
  createdAt: string
  articleCount: number
  followerCount: number
  followingCount: number
  followedByMe: boolean
}

export interface ArticleListItem {
  id: number
  title: string
  summary: string | null
  cover: string | null
  author: AuthorInfo
  tags: TagDTO[]
  viewCount: number
  likeCount: number
  collectCount: number
  commentCount: number
  status: ArticleStatus
  publishedAt: string
}

export interface ArticleDetail extends ArticleListItem {
  contentMd: string
  contentHtml: string
  likedByMe: boolean
  collectedByMe: boolean
  updatedAt: string
}

export interface CommentItem {
  id: number
  articleId: number
  author: AuthorInfo
  content: string
  parentId: number | null
  replyCount: number
  createdAt: string
}

export interface RankItem {
  rank: number
  article: ArticleListItem
  score: number
}

export interface AuthResult {
  accessToken: string
  user: UserProfile
}

export interface SearchResult {
  articles: ArticleListItem[]
  users: AuthorInfo[]
  totalArticles: number
  totalUsers: number
}

// ---------- 输入类型 ----------
export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface UpdateProfileInput {
  username?: string
  bio?: string
  avatar?: string
  locale?: Locale
}

export interface ArticleInput {
  title: string
  summary?: string
  cover?: string
  contentMd: string
  tagIds: number[]
}

export interface CommentInput {
  content: string
  parentId?: number
}

export interface CursorPage {
  cursor?: string
  limit?: number
}

// ---------- 错误码 ----------
export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ARTICLE_NOT_FOUND: 'ARTICLE_NOT_FOUND',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USERNAME_TOO_SHORT: 'USERNAME_TOO_SHORT',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  INVALID_EMAIL: 'INVALID_EMAIL',
  UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  SEARCH_UNAVAILABLE: 'SEARCH_UNAVAILABLE',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export const DEFAULT_TAGS = [
  { name: '前端', slug: 'frontend' },
  { name: '后端', slug: 'backend' },
  { name: '人工智能', slug: 'ai' },
  { name: '数据库', slug: 'database' },
  { name: '云原生', slug: 'cloud-native' },
  { name: '性能优化', slug: 'performance' },
  { name: 'Vue', slug: 'vue' },
  { name: 'React', slug: 'react' },
  { name: 'Node.js', slug: 'nodejs' },
  { name: '工具', slug: 'tools' },
] as const

export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en'
}
