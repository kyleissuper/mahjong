import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZoom } from '../useZoom.ts';

beforeEach(() => localStorage.clear());

describe('useZoom', () => {
  it('defaults to 1 when nothing is stored', () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current[0]).toBe(1);
  });

  it('reads the stored value from localStorage', () => {
    localStorage.setItem('mahjong-zoom', '1.5');
    const { result } = renderHook(() => useZoom());
    expect(result.current[0]).toBe(1.5);
  });

  it('persists changes to localStorage', () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current[1](1.25));
    expect(localStorage.getItem('mahjong-zoom')).toBe('1.25');
    expect(result.current[0]).toBe(1.25);
  });
});
