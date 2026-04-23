import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import { getAdminData } from './lib/admin'
import { useEffect, useState } from 'react'
import { SlArrowLeft } from 'react-icons/sl'
import { GoPlus } from 'react-icons/go'

const navigationItems = [
  { to: '/', label: 'Intro' },
  { to: '/posts', label: '게시판' },
  { to: '/posts/write', label: '글쓰기' },
  { to: '/admin', label: '관리' },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMainPage = location.pathname === '/'
  const isLoginPage = location.pathname === '/login'

  const { isAdmin } = useAuth()
  const [userData, setUserData] = useState<{ nickname: string, bio: string, profileImageUrl: string } | null>(null)

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const data = await getAdminData()
        if (data) {
          setUserData(data)
        }
      }

      catch (error) {
        console.error("Error loading admin data:", error)
      }
    }

    void loadAdminData()
  }, [])

  const handleHeaderBack = () => {
    if (isLoginPage) {
      void navigate(-1)
      return
    }

    void navigate('/')
  }

  return (
    <div>
      <div className='max-w-[600px] bg-white mx-auto relative'>
        <div id='blog_header' className='w-full sticky top-0 left-0 border-b border-neutral-200 bg-white'>
          <div className='relative text-center py-2 text-2xl'>
            {!isMainPage ? (
              <div>
                <button
                type='button'
                aria-label={isLoginPage ? '이전 화면으로 이동' : '인트로로 이동'}
                onClick={handleHeaderBack}
                className='absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#8a6655]/70 cursor-pointer'
              >
                <SlArrowLeft />
              </button>
              <span className='font-bold text-[#35170f]'>
                {isLoginPage ? '관리자 로그인' : `${userData?.nickname || 'Unknown'} Blog`}
              </span>
              </div>
            ) : (
              <div className='flex items-center justify-between px-4'>
                {isAdmin ? (
                  <div className='w-12 h-12 rounded-full overflow-hidden mb-2
                    p-0.75 bg-linear-45 from-[#ff7a18] via-[#ff0069]/70 to-[#7a00ff]
                    shadow-[0_10px_20px_rgba(255,122,24,0.3),_0_6px_6px_rgba(255,122,24,0.22)]
                  '>
                    <img src={userData?.profileImageUrl || ''} alt="Profile" className='w-full h-full bg-white rounded-full'/>
                  </div>
                ) : <div className='w-12 h-12' />} {/* 빈 공간 유지 */}
                
                <div className='text-center flex-1'>
                  <span className='font-bold text-[#35170f]'>{userData?.nickname || 'Unknown'} Blog</span>
                </div>
                {isAdmin ? (
                  <NavLink to={navigationItems[2].to}>
                    <div className='w-12 h-12 flex items-center justify-center' >
                      <GoPlus className='text-2xl' />
                    </div>
                  </NavLink>
                ) : (
                  <NavLink
                    to="/login"
                    className='inline-flex h-12 items-center justify-center rounded-full px-3 text-sm font-semibold text-[#8a6655] transition hover:text-[#35170f]'
                  >
                    로그인
                  </NavLink>
                )}
              </div>
            )}
            
          </div>
        </div>
        <div>
          <Outlet/>
        </div>
          {/* {
            isMainPage && isAdmin ? (
               <div id='admin_edit' className="absolute bottom-10 right-10 -bg-linear-140 from-[#ffeeee]/50 to-[#ddefbb]/70 p-4 z-2 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.15)] cursor-pointer hover:shadow-[0_15px_30px_rgba(0,0,0,0.25)] transition">
                <NavLink to={navigationItems[2].to}>
                  <GoPencil className='text-2xl text-[#8a6655]/80' />
                </NavLink>
              </div>
            ) : null
          } */}
      </div>
    </div>
  )
}

export default App
