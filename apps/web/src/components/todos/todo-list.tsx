import { useState, useEffect } from 'react'
import type { TodoItem, TodoPriority } from '@/types/todo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Trash2, Edit2, Check, X } from 'lucide-react'

interface TodoListProps {
  className?: string
}

export function TodoList({ className }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>('medium')

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos))
    }
  }, [])

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: TodoItem = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        priority: selectedPriority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setTodos([...todos, todo])
      setNewTodo('')
      setSelectedPriority('medium')
    }
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
        : todo
    ))
  }

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = () => {
    if (editText.trim() && editingId) {
      setTodos(todos.map(todo => 
        todo.id === editingId 
          ? { ...todo, text: editText.trim(), updatedAt: new Date().toISOString() }
          : todo
      ))
      setEditingId(null)
      setEditText('')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const filteredTodos = todos.filter(todo => 
    todo.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo List</h1>
        <p className="text-gray-600">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      {/* Add new todo */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Add a new todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Select priority level"
              value={selectedPriority} 
              onChange={(e) => setSelectedPriority(e.target.value as TodoPriority)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Button onClick={addTodo} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Todo list */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {searchTerm ? 'No todos match your search.' : 'No todos yet. Add one above!'}
            </p>
          </Card>
        ) : (
          filteredTodos.map(todo => (
            <Card key={todo.id} className={`p-4 transition-all duration-200 ${
              todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  aria-label="Toggle todo completion status"
                  title="Toggle todo completion"
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1">
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={saveEdit} className="p-2">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="p-2">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`flex-1 ${
                        todo.completed 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-900'
                      }`}>
                        {todo.text}
                      </span>
                      <Badge className={getPriorityColor(todo.priority)}>
                        {todo.priority}
                      </Badge>
                    </div>
                  )}
                </div>

                {editingId !== todo.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(todo)}
                      className="p-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {totalCount > 0 && (
        <Card className="mt-6 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total: {totalCount}</span>
            <span>Completed: {completedCount}</span>
            <span>Remaining: {totalCount - completedCount}</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </Card>
      )}
    </div>
  )
}