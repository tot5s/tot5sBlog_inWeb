import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import { SlArrowLeft } from 'react-icons/sl'
import { GoPencil } from 'react-icons/go'

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

  const { isAdmin, isReady } = useAuth()

  return (
    <div>
      <div className='max-w-[600px] bg-white mx-auto relative'>
        <div id='blog_header' className='w-full sticky top-0 left-0 border-b border-neutral-200 bg-white'>
          <div className='relative text-center py-2 text-2xl'>
            {!isMainPage ? (
              <button
                type='button'
                aria-label='인트로로 이동'
                onClick={() => navigate('/')}
                className='absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#8a6655]/70 cursor-pointer'
              >
                <SlArrowLeft />
              </button>
            ) : null}
            text
          </div>
        </div>
        <div>
          <Outlet/>
        </div>
          {
            isMainPage && isAdmin ? (
               <div id='admin_edit' className="absolute bottom-10 right-10 -bg-linear-140 from-[#ffeeee]/50 to-[#ddefbb]/70 p-4 z-2 rounded-full shadow-lg cursor-pointer">
                <NavLink to={navigationItems[2].to}>
                  <GoPencil className='text-2xl text-[#8a6655]/80' />
                </NavLink>
              </div>
            ) : null
          }
      </div>
    </div>
  )
}

export default App
