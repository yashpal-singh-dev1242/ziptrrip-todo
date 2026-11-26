import { formatDate, isOverdue } from '../utils';

export function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export function DueLabel({ todo }) {
  if (!todo.dueDate) return null;
  const overdue = isOverdue(todo);
  return (
    <span className={overdue ? 'due overdue' : 'due'}>
      {overdue ? 'Overdue · ' : 'Due '}
      {formatDate(todo.dueDate)}
    </span>
  );
}