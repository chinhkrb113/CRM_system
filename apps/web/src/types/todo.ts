export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: TodoPriority
  category?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type TodoPriority = 'low' | 'medium' | 'high'

export interface TodoFilters {
  search?: string
  completed?: boolean
  priority?: TodoPriority[]
  category?: string[]
  dueDate?: {
    from: string
    to: string
  }
}

export interface TodoFormData {
  text: string
  priority: TodoPriority
  category?: string
  dueDate?: string
}