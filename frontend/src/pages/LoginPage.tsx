import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, CheckSquare, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useAuthStore } from '../store/useAuthStore'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.')
      return
    }

    setIsLoading(true)
    try {
      // Prepared for Step 2 API integration
      // Temporary mock authentication for development verification
      const mockUser = {
        id: 'user-mock-1',
        email,
        name: email.split('@')[0],
      }
      const mockToken = 'mock-jwt-token-xyz'

      setAuth(mockUser, mockToken)
      navigate('/')
    } catch {
      setErrorMessage('Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <CheckSquare className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">TaskFlow</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your tasks and projects</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email-input"
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              id="login-password-input"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
              <a href="#forgot" className="text-brand-600 hover:text-brand-700 font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              id="link-to-register"
              className="font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
            >
              Sign up for free
            </Link>
          </div>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-4 p-3 rounded-xl bg-slate-100/80 border border-slate-200/60 text-center text-[11px] text-slate-500">
          💡 Demo Seed Accounts: <span className="font-mono text-slate-700">john@example.com</span> /{' '}
          <span className="font-mono text-slate-700">jane@example.com</span>
        </div>
      </div>
    </div>
  )
}
