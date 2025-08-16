import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { leadsService, type CreateLeadRequest, type Lead } from '@/services/leads'
import { useAuthStore } from '@/stores/auth'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface CreateLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadCreated?: (lead: Lead) => void
}

const sourceOptions: { value: Lead['source']; label: string }[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
]

export function CreateLeadModal({ open, onOpenChange, onLeadCreated }: CreateLeadModalProps) {
  const { token } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CreateLeadRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    source: 'WEBSITE',
    notes: '',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.source) {
      newErrors.source = 'Source is required'
    }

    // Phone validation
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be in international format (e.g., +1234567890)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
  
    if (!token) {
      setErrors({ general: 'Authentication required' })
      return
    }
  
    setLoading(true)
    setErrors({})
  
    try {
      const newLead = await leadsService.createLead(formData, token)
      onLeadCreated?.(newLead)
      showSuccess(`Lead ${newLead.firstName} ${newLead.lastName} has been created successfully!`)
      onOpenChange(false)
      
      // Reset form - bao gồm jobTitle
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        source: 'WEBSITE',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating lead:', error)
      
      // Xử lý lỗi validation chi tiết
      if (error instanceof Error) {
        try {
          // Thử parse response để lấy chi tiết lỗi validation
          const errorMessage = error.message
          if (errorMessage.includes('validation') || errorMessage.includes('Validation')) {
            // Nếu có lỗi validation cụ thể, hiển thị chúng
            if (errorMessage.includes('phone')) {
              setErrors({ phone: 'Phone number must be in international format (e.g., +1234567890)' })
            } else if (errorMessage.includes('email')) {
              setErrors({ email: 'Please enter a valid email address' })
            } else if (errorMessage.includes('source')) {
              setErrors({ source: 'Please select a valid lead source' })
            } else if (errorMessage.includes('firstName')) {
              setErrors({ firstName: 'First name is required and must be at least 2 characters' })
            } else if (errorMessage.includes('lastName')) {
              setErrors({ lastName: 'Last name is required and must be at least 2 characters' })
            } else {
              setErrors({ general: 'Please check your input data and try again.' })
            }
          } else {
            const errorMsg = 'Failed to create lead. Please try again.'
            setErrors({ general: errorMsg })
            showError(errorMsg)
          }
        } catch {
          const errorMsg = 'Failed to create lead. Please try again.'
          setErrors({ general: errorMsg })
          showError(errorMsg)
        }
      } else {
        const errorMsg = 'Failed to create lead. Please try again.'
        setErrors({ general: errorMsg })
        showError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateLeadRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to your CRM system. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general}
            </div>
          )}

          {/* First Name */}
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name *
            </label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name *
            </label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone *
            </label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <label htmlFor="company" className="text-sm font-medium">
              Company
            </label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Enter company name (optional)"
            />
          </div>

          {/* Job Title - Thêm field mới */}
          <div className="space-y-2">
            <label htmlFor="jobTitle" className="text-sm font-medium">
              Job Title
            </label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              placeholder="Enter job title (optional)"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label htmlFor="source" className="text-sm font-medium">
              Source *
            </label>
            <Select
              value={formData.source}
              onValueChange={(value: Lead['source']) => handleInputChange('source', value)}
            >
              <SelectTrigger className={errors.source ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && (
              <p className="text-sm text-red-600">{errors.source}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter additional notes (optional)"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}