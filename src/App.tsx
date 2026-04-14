import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const navigationItems = [
  { to: '/', label: 'Intro' },
  { to: '/posts', label: '게시판' },
  { to: '/admin', label: '관리' },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMainPage = location.pathname === '/'

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
                className='absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-neutral-800'
              >
                ‹
              </button>
            ) : null}
            text
          </div>
        </div>
        <div>
          <Outlet/>
        </div>
          {
            isMainPage ? (
               <div id='admin_edit' className="absolute bottom-10 right-10 bg-amber-100 p-4 z-2 rounded-full ">
                <NavLink to={navigationItems[2].to}>
                  {navigationItems[2].label}
                </NavLink>
              </div>
            ) : null
          }
      </div>
    </div>
  )
}

export default App
