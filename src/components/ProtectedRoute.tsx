import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-context'

function ProtectedRoute() {
  const location = useLocation()
  const { isAdmin, isReady } = useAuth()

  if (!isReady) {
    return <div className="px-6 py-10 text-center text-sm text-neutral-500">로그인 상태를 확인하고 있습니다.</div>
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
