import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import { useAuth } from '../auth-context'
import { isFirebaseConfigured, storage } from '../firebase'
import { createPost, fetchPosts, updatePost } from '../lib/posts'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

import { useNavigate } from 'react-router-dom'



function PostWrite() {
  const { isAdmin, isReady } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  const [category, setCategory] = useState('all')
  const categories = [
  { id: 'daily',    name: '일상',  icon: 'sunny-outline',       color: '#FFD166' },
  { id: 'tech',     name: '기술',  icon: 'code-slash-outline',  color: '#06D6A0' },
  { id: 'travel',   name: '여행',  icon: 'airplane-outline',    color: '#118AB2' },
  { id: 'food',     name: '음식',  icon: 'restaurant-outline',  color: '#FF6B6B' },
  { id: 'thoughts', name: '생각',  icon: 'bulb-outline',        color: '#C77DFF' },
  { id: 'drawing',  name: '그림',  icon: 'color-palette-outline', color: '#F94144' },
  ]

  const canManagePosts = isFirebaseConfigured && isReady && isAdmin
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editorProps: {
      attributes: {
        class:
          'min-h-[60vh] w-full max-w-full resize-none bg-transparent px-0 py-3 text-base text-[#35170f] break-words outline-none placeholder:text-gray-400',
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      setContent(nextEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const postId = new URLSearchParams(window.location.search).get('postId')
    if (postId) {
      // Load the existing post and populate the form
      const loadPost = async () => {
        try {
          const allPosts = await fetchPosts()
          const postToEdit = allPosts.find((post) => post.id === postId)
          
          if (postToEdit) {
            setTitle(postToEdit.title)
            setContent(postToEdit.content)
            setCategory(postToEdit.category)
            setIsPrivate(postToEdit.isPrivate ?? false)
            setPassword(postToEdit.password ?? '')
            editor?.commands.setContent(postToEdit.content)
          } else {
            console.warn('편집할 게시글을 찾지 못했습니다.')
          }
        } catch (error) {
          console.error('게시글을 불러오는 중 오류가 발생했습니다:', error)
        }
      }

      void loadPost()
    }

  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isFirebaseConfigured) {
      return
    }

    if (!isAdmin) {
      return
    }

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const trimmedPassword = password.trim()
    const plainTextContent = editor?.getText().trim() ?? ''

    if (!trimmedTitle || !trimmedContent || !plainTextContent) {
      return
    }

    if (isPrivate && !trimmedPassword) {
      window.alert('비공개 포스트는 비밀번호를 입력해야 합니다.')
      return
    }

    setSubmitting(true)

    
    const postId = new URLSearchParams(window.location.search).get('postId')
    if (postId) {
      await updatePost(postId, trimmedTitle, trimmedContent, category, isPrivate, trimmedPassword)
      setTitle('')
      setContent('')
      setIsPrivate(false)
      setPassword('')
      editor?.commands.clearContent()
      
      navigate('/', {
        replace: true,
        state: {
          toast: '게시글이 성공적으로 수정 되었습니다.'
        }
      })
      return
    }
    

    try {
      await createPost(trimmedTitle, trimmedContent, category, isPrivate, trimmedPassword)
      setTitle('')
      setContent('')
      setIsPrivate(false)
      setPassword('')
      editor?.commands.clearContent()
      
      navigate('/', {
        replace: true,
        state: {
          toast: '게시글이 성공적으로 작성 되었습니다.'
        }
      })
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    if (!editor || !storage || !canManagePosts) {
      event.target.value = ''
      return
    }

    setUploadingImage(true)

    try {
      for (const file of files) {
        const safeFileName = file.name.replace(/\s+/g, '-')
        const storageRef = ref(storage, `posts/${Date.now()}-${safeFileName}`)
        const snapshot = await uploadBytes(storageRef, file)
        const imageUrl = await getDownloadURL(snapshot.ref)

        editor
          .chain()
          .focus()
          .setImage({ src: imageUrl, alt: file.name })
          .createParagraphNear()
          .run()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  return (
    <div className="h-[calc(100vh-50px)] overflow-y-auto bg-white">
      <form className="mx-auto max-w-[1200px] px-4 py-4 gap-3 pb-24 md:pb-6 min-w-0" onSubmit={handleSubmit}>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요."
            className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-3 text-xl md:text-2xl font-semibold text-[#35170f] placeholder-gray-400 outline-none focus:border-[#bf6a43] focus:ring-0"
          />

          {/* 카테고리 */}
          <div className="border-b border-gray-200 py-3">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    category === cat.id
                      ? 'bg-[#bf6a43] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="border-b border-gray-200 py-3">
            <div className="flex items-center gap-3">
              <input
                id="isPrivate"
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => {
                  const nextIsPrivate = event.target.checked
                  setIsPrivate(nextIsPrivate)
                  if (!nextIsPrivate) {
                    setPassword('')
                  }
                }}
                className="h-4 w-4 accent-[#bf6a43]"
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700">
                비공개 포스트로 작성
              </label>
            </div>
            {isPrivate && (
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                className="mt-2 w-full border border-gray-200 rounded px-3 py-2 text-sm text-[#35170f] outline-none focus:border-[#bf6a43]"
              />
            )}
          </div>
          <label htmlFor="content" className="sr-only">내용</label>
          <div className="relative min-w-0 overflow-visible">
            {/* PC용 상단 툴바 (sticky) */}
            <div className="hidden md:block sticky top-0 z-30 bg-white border-y border-gray-200 mb-3">
              <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor}
                  className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                  title="실행 취소"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor}
                  className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                  title="다시 실행"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  disabled={!editor}
                  className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                  title="굵게"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleImageButtonClick}
                  disabled={!editor || uploadingImage || !canManagePosts}
                  className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                  title="이미지"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  disabled={!editor}
                  className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                  title="제목"
                >
                  <span className="font-bold text-sm">T</span>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  disabled={!editor}
                  className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                  title="리스트"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="min-w-0 overflow-x-hidden">
              <EditorContent editor={editor} />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void handleImageUpload(event)}
            className="hidden"
          />
        </form>

        {/* 모바일 하단 고정 툴바 */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
          <div className="flex items-center justify-between px-3 py-2.5 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor}
                className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                title="실행 취소"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor}
                className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                title="다시 실행"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor}
                className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                title="굵게"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleImageButtonClick}
                disabled={!editor || uploadingImage || !canManagePosts}
                className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                title="이미지"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                disabled={!editor}
                className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                title="제목"
              >
                <span className="font-bold text-sm">T</span>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={!editor}
                className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
                title="텍스트 옵션"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              disabled={!editor}
              className="p-2 text-gray-600 hover:text-[#bf6a43] disabled:opacity-40"
              title="키보드"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>
    </div>
  )
}

export default PostWrite
