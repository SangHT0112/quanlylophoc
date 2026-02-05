// components/layout/Header.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Home, User, LogOut, Calendar, BarChart3, BookOpen, Users, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Settings } from "lucide-react"

interface UserInfo {
  id: number
  username: string
  full_name: string
  email?: string
  role: 'teacher' | 'admin'
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notifications] = useState([
    { id: 1, title: "Có 5 học sinh chưa có điểm miệng", time: "Hôm nay" },
    { id: 2, title: "Lớp 9A có 3 học sinh vắng", time: "Hôm nay" },
  ])
  
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
      router.refresh()
    }
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'teacher': 'Giáo viên',
      'admin': 'Quản trị viên'
    }
    return roleMap[role] || role
  }

  if (isLoading) {
    return (
      <header className="w-full border-b bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse" />
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  if (!user) return null

  return (
    <header className="w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
              <div className="p-5 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Quản Lý Lớp Học</h2>
                    <p className="text-xs text-gray-500">Trường THCS</p>
                  </div>
                </div>
              </div>
              
              <div className="py-4 px-2 flex flex-col">
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-base py-6">
                    <Home className="h-5 w-5" />
                    Trang chủ
                  </Button>
                </Link>
                <Link href="/students">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-base py-6">
                    <Users className="h-5 w-5" />
                    Học sinh
                  </Button>
                </Link>
                <Link href="/attendance">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-base py-6">
                    <Calendar className="h-5 w-5" />
                    Điểm danh
                  </Button>
                </Link>
                <Link href="/statistics">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-base py-6">
                    <BarChart3 className="h-5 w-5" />
                    Thống kê
                  </Button>
                </Link>
                
                <Separator className="my-4" />
                
                <Link href="/profile">
                  <Button variant="ghost" className="w-full justify-start gap-3 py-6">
                    <User className="h-5 w-5" />
                    Hồ sơ cá nhân
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" className="w-full justify-start gap-3 py-6">
                    <Settings className="h-5 w-5" />
                    Cài đặt
                  </Button>
                </Link>
                
                <Separator className="my-4" />
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 py-6"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Đăng xuất
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Quản Lý Lớp</h1>
              <p className="text-xs text-gray-500">THCS</p>
            </div>
          </Link>

           <nav className="hidden md:flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Trang chủ
              </Button>
            </Link>
            
            <Link href="/students">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Học sinh
              </Button>
            </Link>
            
            <Link href="/statistics">
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Thống kê
              </Button>
            </Link>
          </nav>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2 sm:gap-4">
         

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-1 sm:p-2 hover:bg-gray-100 rounded-full">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm sm:text-base">
                    {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {user.full_name || user.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{user.full_name || user.username}</p>
                  <p className="text-xs text-gray-500">{user.email || '—'}</p>
                  <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Hồ sơ cá nhân
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}