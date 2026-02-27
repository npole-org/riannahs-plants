export function isDueOnOrBefore(dateISO, now = new Date()) {
  const due = new Date(dateISO);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  return due <= now;
}
