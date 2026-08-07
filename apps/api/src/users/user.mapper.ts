import type { User } from '@prisma/client'
import type { Locale, UserProfile } from '@devflow/shared'
import { isLocale } from '@devflow/shared'

export async function toUserProfile(
  user: Pick<User, 'id' | 'username' | 'avatar' | 'bio' | 'role' | 'locale' | 'createdAt'>,
): Promise<UserProfile> {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role as UserProfile['role'],
    locale: isLocale(user.locale) ? user.locale : 'zh',
    createdAt: user.createdAt.toISOString(),
    articleCount: 0,
    followerCount: 0,
    followingCount: 0,
    followedByMe: false,
  }
}

export function normalizeLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : 'zh'
}
