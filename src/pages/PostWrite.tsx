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
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  const [category, setCategory] = useState('all')
  const categories = [
   { id: 'all',      name: '전체',  icon: 'grid-outline',        color: '#C8FF00' },
  { id: 'daily',    name: '일상',  icon: 'sunny-outline',       color: '#FFD166' },
  { id: 'tech',     name: '기술',  icon: 'code-slash-outline',  color: '#06D6A0' },
  { id: 'travel',   name: '여행',  icon: 'airplane-outline',    color: '#118AB2' },
  { id: 'food',     name: '음식',  icon: 'restaurant-outline',  color: '#FF6B6B' },
  { id: 'thoughts', name: '생각',  icon: 'bulb-outline',        color: '#C77DFF' },
    
  ]

  const canManagePosts = isFirebaseConfigured && isReady && isAdmin
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editorProps: {
      attributes: {
        class:
          'min-h-[320px] rounded-b-2xl bg-[#fffdfa] px-4 py-3.5 text-[#35170f] outline-none',
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
    const plainTextContent = editor?.getText().trim() ?? ''

    if (!trimmedTitle || !trimmedContent || !plainTextContent) {
      return
    }

    setSubmitting(true)

    
    const postId = new URLSearchParams(window.location.search).get('postId')
    if (postId) {
      await updatePost(postId, trimmedTitle, trimmedContent, category,)
      setTitle('')
      setContent('')
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
      await createPost(trimmedTitle, trimmedContent, category)
      setTitle('')
      setContent('')
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
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!editor || !storage || !canManagePosts) {
      event.target.value = ''
      return
    }

    setUploadingImage(true)

    try {
      const safeFileName = file.name.replace(/\s+/g, '-')
      const storageRef = ref(storage, `posts/${Date.now()}-${safeFileName}`)
      const snapshot = await uploadBytes(storageRef, file)
      const imageUrl = await getDownloadURL(snapshot.ref)

      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run()
    } catch (error) {
      console.error(error)
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const toolbarButtonClassName =
    'rounded-xl border border-[#dfc3ae] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-[#5d3322] transition hover:border-[#bf6a43] hover:text-[#35170f] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className='bg-white max-h-screen h-[calc(100vh_-_50px)] px-4 py-4'>
      <form className="grid gap-3" onSubmit={handleSubmit}>
          <label htmlFor="title" className="text-sm font-bold text-[#5d3322]">
            제목
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 오늘의 기록"
            className="w-full rounded-2xl border border-[#dfc3ae] bg-[#fffdfa] px-4 py-3.5 text-[#35170f] outline-none transition focus:border-[#bf6a43] focus:ring-4 focus:ring-[rgba(191,106,67,0.18)]"
          />
          <label htmlFor="category" className="text-sm font-bold text-[#5d3322]">
            카테고리
          </label>
          <div>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`mr-2 mb-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === cat.id
                    ? 'bg-[#bf6a43] text-white border-[#bf6a43]'
                    : 'bg-[#fffdfa] text-[#5d3322] border border-[#dfc3ae] hover:bg-[#f0e6d9]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <label htmlFor="content" className="text-sm font-bold text-[#5d3322]">
            내용
          </label>
          <div className="overflow-hidden rounded-2xl border border-[#dfc3ae] bg-[#fffdfa] transition focus-within:border-[#bf6a43] focus-within:ring-4 focus-within:ring-[rgba(191,106,67,0.18)] max-h-[400px]">
            <div className="flex flex-wrap gap-2 border-b border-[#ead6c9] bg-[#fff7f1] px-3 py-3">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor}
                className={toolbarButtonClassName}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor}
                className={toolbarButtonClassName}
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                disabled={!editor}
                className={toolbarButtonClassName}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={!editor}
                className={toolbarButtonClassName}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setParagraph().run()}
                disabled={!editor}
                className={toolbarButtonClassName}
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={handleImageButtonClick}
                disabled={!editor || uploadingImage || !canManagePosts}
                className={toolbarButtonClassName}
              >
                {uploadingImage ? 'Uploading...' : 'Image'}
              </button>
            </div>
            <EditorContent editor={editor} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => void handleImageUpload(event)}
            className="hidden"
          />

          <button
            type="submit"
            disabled={submitting || !canManagePosts || !editor || uploadingImage}
            className="rounded-2xl bg-linear-to-r from-[#bf6a43] to-[#dd8a61] px-4 py-3.5 font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? '저장 중...' : '게시글 저장'}
          </button>
        </form>
    </div>
  )
}

export default PostWrite
