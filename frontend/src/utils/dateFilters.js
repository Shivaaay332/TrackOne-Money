/** Local date helpers — avoids UTC shift bugs with toISOString() */

export const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDateFilters = (period) => {
  if (period === 'All Time') {
    return { query: '?period=all', listQuery: '', start: null, end: null, period: 'all' };
  }

  const start = new Date();
  const end = new Date();

  if (period === 'This Month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    const dates = `startDate=${formatLocalDate(start)}&endDate=${formatLocalDate(end)}`;
    return {
      query: `?${dates}&period=month`,
      listQuery: `?${dates}`,
      start,
      end,
      period: 'month',
    };
  }

  if (period === 'This Year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
    const dates = `startDate=${formatLocalDate(start)}&endDate=${formatLocalDate(end)}`;
    return {
      query: `?${dates}&period=year`,
      listQuery: `?${dates}`,
      start,
      end,
      period: 'year',
    };
  }

  return { query: '?period=all', listQuery: '', start: null, end: null, period: 'all' };
};

export const PERIOD_LABELS = {
  'All Time': 'All Time',
  'This Month': 'This Month',
  'This Year': 'This Year',
};
