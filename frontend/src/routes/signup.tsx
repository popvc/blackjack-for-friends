import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import type { SignupData } from '../types/auth'

export const Route = createFileRoute('/signup')({
  component: SignupComponent,
})

function SignupComponent() {
  const [formData, setFormData] = useState<SignupData>({ username: '', email: '', password: '' })
  const { signup, isSigningUp } = useAuthStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    signup(formData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 w-full max-w-sm card-border">
        <div className="card-body">
          <h2 className="card-title text-2xl">Create an account</h2>
          <p className="text-base-content/60 text-sm">Sign up to get started</p>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Username</legend>
              <input
                type="text"
                name="username"
                placeholder="johndoe"
                className="input w-full"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="input w-full"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Password</legend>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="input w-full"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary btn-block mt-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? <span className="loading loading-spinner loading-sm" /> : "Sign up"}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/60 mt-2">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
