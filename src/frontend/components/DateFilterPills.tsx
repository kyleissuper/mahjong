import type { DateFilter } from '../../mahjong/history.ts';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all-time', label: 'All time' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export function DateFilterPills({ value, onChange }: {
  value: DateFilter; onChange: (v: DateFilter) => void;
}) {
  return (
    <div className="history-date-filters">
      {DATE_FILTERS.map(f => (
        <button key={f.value}
          className={`history-date-btn ${value === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
