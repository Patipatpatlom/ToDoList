import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckSquare, LogOut, User as UserIcon, Bell } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from './Button'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link
          to="/"
          id="nav-brand-link"
          className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-sm shadow-brand-500/30">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
              TaskFlow
            </span>
            <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Management Suite
            </span>
          </div>
        </Link>

        {/* Center / Workspace Quick Info */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200 text-xs text-slate-600 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Workspace: Main Production</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                id="nav-notifications-btn"
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs border border-brand-200">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name || 'Workspace User'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {user?.email || 'user@workspace.local'}
                  </span>
                </div>
                <Button
                  id="nav-logout-btn"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-rose-600 ml-1"
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button id="nav-login-link" variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button id="nav-register-link" variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
