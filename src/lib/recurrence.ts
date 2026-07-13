
const WEEKDAYS: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export const calculateNextOccurrence = (
  type: string,
  recurringDay?: string,
  recurringTime?: string,
  baseDate: Date = new Date()
): string | undefined => {
  if (type === 'one-time' || !recurringTime) return undefined;

  const [hours, minutes] = recurringTime.split(':').map(Number);
  
  const candidate = new Date(baseDate);
  candidate.setHours(hours, minutes, 0, 0);

  // If it's daily
  if (type === 'daily') {
    if (candidate <= baseDate) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate.toISOString();
  }

  // If it's weekly
  if (type === 'weekly' && recurringDay) {
    const days = recurringDay.split(',').map((d) => d.trim().toLowerCase());
    const targetDays = days.map((d) => WEEKDAYS[d]).filter((d) => d !== undefined);
    
    if (targetDays.length === 0) return undefined;

    let daysToAdd = 1;
    while (daysToAdd <= 7) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      nextDate.setHours(hours, minutes, 0, 0);

      if (targetDays.includes(nextDate.getDay()) && nextDate > baseDate) {
        return nextDate.toISOString();
      }
      daysToAdd++;
    }
  }

  // If it's monthly
  if (type === 'monthly' && recurringDay) {
    const targetDate = parseInt(recurringDay, 10);
    if (isNaN(targetDate)) return undefined;

    candidate.setDate(targetDate);
    
    if (candidate <= baseDate) {
      candidate.setMonth(candidate.getMonth() + 1);
      // Handle month rollover correctly (e.g. asking for 31st in Feb)
      if (candidate.getDate() !== targetDate) {
        // e.g. if we set month to March, and date was 31, it might have rolled over.
        candidate.setDate(0); 
      }
    }
    return candidate.toISOString();
  }

  return undefined;
};
