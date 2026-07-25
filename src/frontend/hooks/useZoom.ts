import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mahjong-zoom';

export function useZoom(): [number, (zoom: number) => void] {
  const [zoom, setZoom] = useState(() => Number(localStorage.getItem(STORAGE_KEY)) || 1);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(zoom));
  }, [zoom]);
  return [zoom, setZoom];
}
