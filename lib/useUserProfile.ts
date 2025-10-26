import { db } from '@/lib/instant';

export function useUserProfile(userId: string | undefined) {
  const { data, isLoading } = db.useQuery(
    userId ? { userProfiles: {} } : null as any
  );

  const profile = userId && data
    ? (data as any)?.userProfiles?.find((p: any) => p.userId === userId)
    : null;

  return { profile, isLoading };
}
