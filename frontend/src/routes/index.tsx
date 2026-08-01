import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '../store/useAuthStore'
import ContactsCard from '../components/contacts/ContactsCard'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { signout, authUser, isCheckingAuth, isSigningOut } = useAuthStore()


  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200 p-4">
      <div className="card bg-base-100 w-full max-w-sm card-border">
        <div className="card-body">
          <h2 className="card-title text-2xl">Auth Check</h2>
          <p className="text-base-content/60 text-sm">Check your current session status</p>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">User ID:</span>
              {isCheckingAuth
                ? <span className="loading loading-spinner loading-sm" />
                : authUser !== null
                  ? <span className="badge badge-success">{authUser.userId}</span>
                  : <span className="badge badge-error badge-soft">Not authenticated</span>
              }
            </div>

            <button
              className="btn btn-error btn-block"
              onClick={signout}
              disabled={isSigningOut}
            >
              {isSigningOut ? <span className="loading loading-spinner loading-sm" /> : "Sign out"}
            </button>
          </div>
        </div>
      </div>

      {authUser !== null && <ContactsCard />}
    </div>
  )
}
