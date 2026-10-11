'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

type AuthFormMode = 'sign-in' | 'sign-up'

type AuthFormProps = {
  mode: AuthFormMode
  showGoogleAuth?: boolean
}

export default function AuthForm({
  mode,
  showGoogleAuth = false,
}: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const isSignUp = mode === 'sign-up'
  const title = isSignUp ? 'Create your account' : 'Welcome back'
  const subtitle = isSignUp
    ? 'Start tracking your health with a secure account.'
    : 'Sign in to continue journaling.'
  const submitLabel = isSignUp ? 'Create account' : 'Sign in'
  const alternateHref = isSignUp ? '/sign-in' : '/sign-up'
  const alternateLabel = isSignUp ? 'Already have an account?' : "Don't have an account?"
  const alternateCta = isSignUp ? 'Sign in' : 'Sign up'

  const submitDisabled = useMemo(() => {
    if (!email || !password) return true
    if (!isSignUp) return false
    return !name || !confirmPassword
  }, [confirmPassword, email, isSignUp, name, password])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)

      if (isSignUp) {
        const response = await signUp.email({
          name,
          email,
          password,
          callbackURL: '/new-user',
        })

        if (response.error) {
          throw new Error(response.error.message || 'Unable to create account.')
        }

        router.push('/new-user')
      } else {
        const response = await signIn.email({
          email,
          password,
          callbackURL: '/journal',
        })

        if (response.error) {
          throw new Error(response.error.message || 'Unable to sign in.')
        }

        router.push('/journal')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      setIsGoogleSubmitting(true)

      const response = await signIn.social({
        provider: 'google',
        callbackURL: '/journal',
        newUserCallbackURL: '/new-user',
      })

      if (response.error) {
        throw new Error(
          response.error.message || 'Unable to start Google sign in.'
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-[32px] bg-white/80 p-8 shadow-xl backdrop-blur-md">
      <div className="mb-8 space-y-3 text-center">
        <h1
          className="text-3xl font-semibold text-forest"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {title}
        </h1>
        <p
          className="text-sm text-forest-muted"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {subtitle}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isSignUp ? (
          <label className="block text-sm text-forest-muted">
            <span className="mb-2 block">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-sage-light/70 bg-white px-4 py-3 text-forest outline-hidden transition-colors focus:border-sage"
              autoComplete="name"
              name="name"
              required
            />
          </label>
        ) : null}

        <label className="block text-sm text-forest-muted">
          <span className="mb-2 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-sage-light/70 bg-white px-4 py-3 text-forest outline-hidden transition-colors focus:border-sage"
            autoComplete="email"
            name="email"
            required
          />
        </label>

        <label className="block text-sm text-forest-muted">
          <span className="mb-2 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-sage-light/70 bg-white px-4 py-3 text-forest outline-hidden transition-colors focus:border-sage"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            name="password"
            required
          />
        </label>

        {isSignUp ? (
          <label className="block text-sm text-forest-muted">
            <span className="mb-2 block">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-sage-light/70 bg-white px-4 py-3 text-forest outline-hidden transition-colors focus:border-sage"
              autoComplete="new-password"
              name="confirmPassword"
              required
            />
          </label>
        ) : null}

        {error ? (
          <p
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitDisabled || isSubmitting || isGoogleSubmitting}
          className="w-full rounded-full bg-sage px-8 py-4 text-sm font-medium text-white transition-all duration-200 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {isSubmitting ? 'Please wait...' : submitLabel}
        </button>
      </form>

      {showGoogleAuth ? (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-sage-light/70" />
            <span
              className="text-xs uppercase tracking-[0.2em] text-forest-muted"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Or continue with
            </span>
            <div className="h-px flex-1 bg-sage-light/70" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full rounded-full border border-sage-light/70 bg-white px-8 py-4 text-sm font-medium text-forest transition-colors hover:bg-sage-light/20 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {isGoogleSubmitting ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </>
      ) : null}

      <p
        className="mt-6 text-center text-sm text-forest-muted"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        {alternateLabel}{' '}
        <Link className="font-medium text-sage hover:underline" href={alternateHref}>
          {alternateCta}
        </Link>
      </p>
    </div>
  )
}
