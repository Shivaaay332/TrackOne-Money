const parseLocalDate = (dateStr, endOfDay = false) => {
  if (!dateStr) return null;
  if (dateStr.includes('T')) return new Date(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
};

const buildDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const range = {};
  if (startDate) range.$gte = parseLocalDate(startDate, false);
  if (endDate) range.$lte = parseLocalDate(endDate, true);
  return range;
};

module.exports = { parseLocalDate, buildDateRange };
