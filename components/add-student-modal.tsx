// components/add-student-modal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

interface AddStudentModalProps {
  isOpen: boolean
  deskNumber: number | null
  onClose: () => void
  onSave: (studentData: {
    name: string
    deskNumber: number
    side: 'left' | 'right'
  }) => void
}

export default function AddStudentModal({ isOpen, deskNumber, onClose, onSave }: AddStudentModalProps) {
  const [name, setName] = useState('')
  const [side, setSide] = useState<'left' | 'right'>('left')

  if (!isOpen || !deskNumber) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Vui lòng nhập tên học sinh')
      return
    }

    onSave({
      name: name.trim(),
      deskNumber,
      side
    })

    // Reset form
    setName('')
    setSide('left')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Thêm học sinh mới
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="desk">Số bàn</Label>
              <Input
                id="desk"
                value={deskNumber}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Ô bàn {deskNumber} {deskNumber <= 20 ? '(Dãy trái)' : '(Dãy phải)'}
              </p>
            </div>

            <div>
              <Label htmlFor="name">Tên học sinh *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ tên học sinh"
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="side">Vị trí dãy</Label>
              <Select
                value={side}
                onValueChange={(value: 'left' | 'right') => setSide(value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Chọn dãy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Dãy trái</SelectItem>
                  <SelectItem value="right">Dãy phải</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Dãy trái: bàn 1-20, Dãy phải: bàn 21-40
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
            >
              Thêm học sinh
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}