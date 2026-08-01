import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import type { LoginData } from "../types/auth";

export const Route = createFileRoute("/signin")({
  component: SigninComponent,
});

function SigninComponent() {
  const [formData, setFormData] = useState<LoginData>({ email: "", password: "" });
  const { signin, isSigningIn } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    signin(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 w-full max-w-sm card-border">
        <div className="card-body">
          <h2 className="card-title text-2xl">Welcome back</h2>
          <p className="text-base-content/60 text-sm">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
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

            <button type="submit" className="btn btn-primary btn-block mt-2" disabled={isSigningIn}>
              {isSigningIn ? <span className="loading loading-spinner loading-sm" /> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/60 mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="link link-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
