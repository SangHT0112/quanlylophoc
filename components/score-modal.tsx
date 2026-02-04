'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface ScoreModalProps {
  isOpen: boolean
  studentName: string
  onClose: () => void
  onSave: (score: number, noteType: string, note: string) => void
}

export default function ScoreModal({ isOpen, studentName, onClose, onSave }: ScoreModalProps) {
  const [scoreValue, setScoreValue] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)

  // Validate score input
  useEffect(() => {
    if (!scoreValue.trim()) {
      setError('')
      setIsValid(false)
      return
    }

    const numScore = Number(scoreValue)
    
    // Check if it's a valid number
    if (isNaN(numScore)) {
      setError('Vui lòng nhập số hợp lệ')
      setIsValid(false)
      return
    }

    // Check range 0-10
    if (numScore < 0 || numScore > 10) {
      setError('Điểm phải từ 0 đến 10')
      setIsValid(false)
      return
    }

    // Check decimal places (allow .0, .5, .25, .75, etc.)
    const decimalPart = scoreValue.split('.')[1]
    if (decimalPart && decimalPart.length > 2) {
      setError('Chỉ cho phép tối đa 2 chữ số thập phân')
      setIsValid(false)
      return
    }

    // Valid score
    setError('')
    setIsValid(true)
  }, [scoreValue])

  const handleSave = () => {
    if (!isValid) {
      setError('Vui lòng nhập điểm hợp lệ (0-10)')
      return
    }

    const numScore = Number(scoreValue)
    onSave(numScore, 'Miệng', '') // Mặc định loại điểm là "Miệng"
    
    // Reset form
    setScoreValue('')
    setError('')
    setIsValid(false)
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Allow empty, numbers, and one dot
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setScoreValue(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSave()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setScoreValue('')
      setError('')
      setIsValid(false)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Điểm Kiểm Tra Miệng
          </DialogTitle>
          <DialogDescription className="text-gray-700 pt-1">
            Học sinh: <span className="font-bold text-slate-800">{studentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Score Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scoreValue" className="font-semibold text-gray-800 text-base">
                Nhập điểm (0-10)
              </Label>
              {scoreValue && isValid && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Hợp lệ</span>
                </div>
              )}
            </div>
            
            <div className="relative">
              <Input
                id="scoreValue"
                type="text"
                inputMode="decimal"
                placeholder="Ví dụ: 8.5, 9, 9.75"
                value={scoreValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`
                  bg-white border-2 text-gray-900 placeholder:text-gray-500 
                  focus:ring-2 focus:ring-offset-1 text-lg font-medium h-12
                  ${error 
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                    : isValid 
                      ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                  }
                `}
                autoFocus
              />
              
              {scoreValue && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400 font-medium">/10</span>
                </div>
              )}
            </div>

            {/* Quick Score Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[7, 7.5, 8, 8.5, 9, 9.5, 10].map((quickScore) => (
                <Button
                  key={quickScore}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScoreValue(quickScore.toString())}
                  className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                  {quickScore}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScoreValue('')}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Xóa
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className={`
              px-6 transition-all duration-200
              ${isValid 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Lưu Điểm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}