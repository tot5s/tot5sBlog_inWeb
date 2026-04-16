import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth.tsx'
import './index.css'
import App from './App.tsx'
import AdminPage from './pages/AdminPage.tsx'
import PostWrite from './pages/PostWrite.tsx'
import IntroPage from './pages/IntroPage.tsx'
import PostsPage from './pages/PostsPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<IntroPage />} />
            <Route path="posts/:postId" element={<PostsPage />} />
            <Route path="posts/write" element={<PostWrite />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
