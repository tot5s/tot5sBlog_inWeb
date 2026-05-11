import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth.tsx'
import './index.css'
import App from './App.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

const AdminPage = lazy(() => import('./pages/AdminPage.tsx'))
const PostWrite = lazy(() => import('./pages/PostWrite.tsx'))
const IntroPage = lazy(() => import('./pages/IntroPage.tsx'))
const PostsPage = lazy(() => import('./pages/PostsPage.tsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-4 text-sm text-neutral-500">불러오는 중...</div>}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<IntroPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="posts/:postId" element={<PostsPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="posts/write" element={<PostWrite />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
