export function safeDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Recent";
  
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return "Recent";
    return dateInput.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  let dateString = String(dateInput);
  
  // Safely replace dashes for Safari compatibility
  if (dateString.includes('-') && !dateString.includes('T')) {
    dateString = dateString.replace(/-/g, '/');
  }

  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return "Recent";

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
