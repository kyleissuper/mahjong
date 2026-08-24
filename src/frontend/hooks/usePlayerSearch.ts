import useSWR, { useSWRConfig } from 'swr';
import * as api from '../lib/api.ts';

export function usePlayerSearch(query: string, enabled: boolean) {
  const key = enabled ? `players:${query}` : null;
  const { data, error, isLoading } = useSWR(
    key,
    () => api.searchPlayers(query),
    { keepPreviousData: true, dedupingInterval: 300 },
  );
  const { mutate } = useSWRConfig();

  function invalidate() {
    mutate(k => typeof k === 'string' && k.startsWith('players:'), undefined, { revalidate: true });
  }

  return {
    players: data?.players.map(p => ({ id: p.id, name: p.name })) ?? [],
    isLoading,
    error,
    invalidate,
  };
}
