import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckSquare, LogOut, User as UserIcon, Bell, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from './Button'

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const currentLang = i18n.language.startsWith('th') ? 'th' : 'en'

  const toggleLanguage = (lang: 'th' | 'en') => {
    i18n.changeLanguage(lang)
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link
          to="/"
          id="nav-brand-link"
          className="flex items-center gap-2.5 group transition-transform hover:scale-[1.01]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs group-hover:bg-brand-700 transition-colors">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
              {t('common.appName')}
            </span>
            <span className="text-[10px] font-medium tracking-wide text-slate-400">
              {t('common.suite')}
            </span>
          </div>
        </Link>

        {/* Center / Workspace Quick Info */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-xs text-slate-600 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {t('navbar.workspaceLabel')}: <strong className="text-slate-700 font-semibold">{t('navbar.workspaceName')}</strong>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher (Compact TH / EN) */}
          <div
            id="nav-language-switcher"
            className="flex items-center rounded-lg bg-slate-100/90 p-0.5 border border-slate-200/60"
            title={t('common.language')}
          >
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            <button
              id="lang-btn-th"
              type="button"
              onClick={() => toggleLanguage('th')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                currentLang === 'th'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              TH
            </button>
            <button
              id="lang-btn-en"
              type="button"
              onClick={() => toggleLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                currentLang === 'en'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                id="nav-notifications-btn"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                aria-label={t('navbar.notifications')}
              >
                <Bell className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-semibold text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name || t('navbar.defaultUser')}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight">
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
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button id="nav-login-link" variant="ghost" size="sm">
                  {t('navbar.signIn')}
                </Button>
              </Link>
              <Link to="/register">
                <Button id="nav-register-link" variant="primary" size="sm">
                  {t('navbar.getStarted')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
