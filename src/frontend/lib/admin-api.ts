import type { RegisteredPlayer } from '../../mahjong/player-registry.ts';

function adminHeaders(): Record<string, string> {
  const token = localStorage.getItem('mj-admin-token');
  return token ? { 'x-admin-token': token } : {};
}

async function getAdmin<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: adminHeaders() });
  const body = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

async function postAdmin<T = void>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(data),
  });
  const body = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export async function listSessions(): Promise<{ sessions: any[] }> {
  return getAdmin<{ sessions: any[] }>('/api/admin/sessions');
}

export async function deleteSession(code: string): Promise<void> {
  await postAdmin(`/api/admin/sessions/${code}/delete`, {});
}

export async function extendSession(code: string, hours = 24): Promise<void> {
  await postAdmin(`/api/admin/sessions/${code}/extend`, { hours });
}

export async function expireSession(code: string): Promise<void> {
  await postAdmin(`/api/admin/sessions/${code}/expire`, {});
}

export async function deleteHand(id: number): Promise<void> {
  await postAdmin(`/api/admin/hands/${id}/delete`, {});
}

export async function listPlayers(): Promise<{ players: RegisteredPlayer[] }> {
  return getAdmin<{ players: RegisteredPlayer[] }>('/api/admin/players');
}

export async function renamePlayer(id: string, name: string): Promise<any> {
  return postAdmin(`/api/admin/players/${id}/rename`, { name });
}

export async function deletePlayer(id: string): Promise<void> {
  await postAdmin(`/api/admin/players/${id}/delete`, {});
}

export async function mergePlayers(keepId: string, mergeId: string): Promise<void> {
  await postAdmin('/api/admin/players/merge', { keepId, mergeId });
}

export interface BackupStatus {
  email: string | null;
  lastBackup: { at: string; ok: boolean; detail: string } | null;
}

export async function downloadBackup(): Promise<void> {
  const res = await fetch('/api/admin/backup/download', { headers: adminHeaders() });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? 'mahjong-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function sendBackupNow(): Promise<{ ok: boolean; detail: string }> {
  return postAdmin<{ ok: boolean; detail: string }>('/api/admin/backup/send', {});
}

export async function getBackupEmail(): Promise<BackupStatus> {
  return getAdmin<BackupStatus>('/api/admin/backup-email');
}

export async function setBackupEmail(email: string | null): Promise<void> {
  await postAdmin('/api/admin/backup-email', { email });
}

export async function getTimingStats(): Promise<{ timings: any[] }> {
  return getAdmin<{ timings: any[] }>('/api/admin/timing');
}

