const TIME_ZONE = 'Africa/Casablanca';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
});

export const formatDateTime = (iso: string) =>
  dateTimeFormat.format(new Date(iso));

const relativeFormat = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
});

const shortDateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeZone: TIME_ZONE,
});

export const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000); // positive = in the past

  if (seconds < 60) return 'just now'; // also covers small clock differences
  if (seconds < 3600) return relativeFormat.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return relativeFormat.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 7 * 86400) return relativeFormat.format(-Math.floor(seconds / 86400), 'day');

  return shortDateFormat.format(date); 
};
