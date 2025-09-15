import { Column } from '@/types/storage'

export type BoardTemplateId = 'basic' | 'scrum' | 'bug-triage'

export function getTemplateColumns(template: BoardTemplateId): Column[] {
  switch (template) {
    case 'scrum':
      return [
        { id: 'backlog', title: 'Backlog', cards: [], color: '#6b7280' },
        { id: 'todo', title: 'To Do', cards: [], color: '#3b82f6' },
        { id: 'in-progress', title: 'In Progress', cards: [], color: '#f59e0b' },
        { id: 'review', title: 'Review', cards: [], color: '#8b5cf6' },
        { id: 'done', title: 'Done', cards: [], color: '#10b981' },
      ]
    case 'bug-triage':
      return [
        { id: 'incoming', title: 'Incoming', cards: [], color: '#6b7280' },
        { id: 'triage', title: 'Triage', cards: [], color: '#ef4444' },
        { id: 'in-progress', title: 'In Progress', cards: [], color: '#f59e0b' },
        { id: 'verify', title: 'Verify', cards: [], color: '#3b82f6' },
        { id: 'done', title: 'Done', cards: [], color: '#10b981' },
      ]
    case 'basic':
    default:
      return [
        { id: 'backlog', title: 'Backlog', cards: [], color: '#6b7280' },
        { id: 'todo', title: 'To Do', cards: [], color: '#3b82f6' },
        { id: 'in-progress', title: 'In Progress', cards: [], color: '#f59e0b' },
        { id: 'review', title: 'Review', cards: [], color: '#8b5cf6' },
        { id: 'done', title: 'Done', cards: [], color: '#10b981' },
      ]
  }
}

