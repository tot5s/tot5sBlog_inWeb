import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../auth-context'

type LoginLocationState = {
  from?: string
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, isReady, signInWithGoogle, signOutFromGoogle, user } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')
  const from = (location.state as LoginLocationState | null)?.from || '/'

  useEffect(() => {
    if (isReady && isAdmin) {
      navigate(from, { replace: true })
    }
  }, [from, isAdmin, isReady, navigate])

  const handleGoogleLogin = async () => {
    setErrorMessage('')

    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google 로그인 중 오류가 발생했습니다:', error)
      setErrorMessage('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleSignOut = async () => {
    setErrorMessage('')

    try {
      await signOutFromGoogle()
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error)
      setErrorMessage('로그아웃 중 오류가 발생했습니다.')
    }
  }

  const isSignedInButNotAdmin = isReady && !!user && !isAdmin

  return (
    <div className="flex min-h-[calc(100vh-50px)] items-center justify-center px-5 py-8">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[32px] border border-[#ead6c9] bg-[linear-gradient(180deg,#fffaf6_0%,#fff2e8_100%)] shadow-[0_24px_80px_rgba(93,51,34,0.12)]">
        <div className="border-b border-[#f1ddd1] px-7 py-8">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#bf6a43]">
            Admin Access
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-[#35170f]">관리자 로그인</h1>
          <p className="mt-3 text-sm leading-6 text-[#7f5d51]">
            Google 계정으로 로그인하고 글쓰기와 관리 페이지에 접근할 수 있습니다.
          </p>
        </div>

        <div className="space-y-5 px-7 py-7">
          {isSignedInButNotAdmin ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
              <div className="font-semibold">관리자 계정이 아닙니다.</div>
              <div className="mt-1 break-all">{user.email}</div>
              <div className="mt-2 text-amber-800">
                현재 계정에는 관리자 권한이 없어서 글쓰기와 관리 기능에 접근할 수 없습니다.
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#35170f] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#4c2318]"
          >
            <FcGoogle className="text-xl" />
            Google로 로그인
          </button>

          <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm leading-6 text-[#6d4c40]">
            로그인 후 관리자 이메일과 일치하면 자동으로 관리 페이지 접근 권한이 열립니다.
          </div>

          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="text-sm font-medium text-[#8a6655] transition hover:text-[#35170f]"
            >
              홈으로 돌아가기
            </Link>
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-[#dfc3ae] px-4 py-2 text-sm font-medium text-[#5d3322] transition hover:border-[#bf6a43] hover:text-[#35170f]"
              >
                로그아웃
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
