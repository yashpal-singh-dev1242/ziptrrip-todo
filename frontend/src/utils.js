// Today's date as YYYY-MM-DD in the user's local time zone
export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function isOverdue(todo) {
  return !todo.completed && Boolean(todo.dueDate) && todo.dueDate < todayString();
}

// Formats a YYYY-MM-DD string without shifting it by time zone
export function formatDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}