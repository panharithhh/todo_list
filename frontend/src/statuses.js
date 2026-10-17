export const STATUSES = ['To Do', 'In Progress', 'Done']
 
export function statusClass(status) {
  return status.toLowerCase().replace(' ', '-')
}
