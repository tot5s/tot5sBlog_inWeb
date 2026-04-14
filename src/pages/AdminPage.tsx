import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import { useAuth } from '../auth-context'
import { isFirebaseConfigured, storage } from '../firebase'
import { createPost, fetchPosts } from '../lib/posts'
import type { PostItem } from '../types/post'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

function AdminPage() {
  const { isAdmin, isReady } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [, setPosts] = useState<PostItem[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

    const loadPosts = async () => {
      try {
        setPosts(await fetchPosts())
      } catch (error) {
        console.error(error)
      }
    }

    void loadPosts()
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

    try {
      const nextPost = await createPost(trimmedTitle, trimmedContent, 'tech')
      setPosts((currentPosts) => [nextPost, ...currentPosts])
      setTitle('')
      setContent('')
      editor?.commands.clearContent()
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
    // <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
    //   <article className="rounded-[28px] border border-[rgba(155,95,61,0.14)] bg-white/90 p-6 shadow-[0_18px_60px_rgba(88,47,27,0.08)] backdrop-blur sm:p-8">
    //     <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#bf6a43]">
    //       Admin
    //     </p>
    //     <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#35170f]">
    //       게시글 작성
    //     </h2>
    //     <p className="mt-3 text-base leading-7 text-[#6f4a38]">
    //       새 게시글을 작성해 Firestore에 저장하고, 오른쪽에서 기존 글을 바로 삭제할 수
    //       있습니다.
    //     </p>

    //     <div className="mt-6 rounded-[24px] border border-[#f0daca] bg-[#fff8f2] p-5">
    //       <p className="text-sm font-semibold text-[#5d3322]">관리자 인증</p>
    //       {!isFirebaseEnabled ? (
    //         <p className="mt-2 leading-7 text-[#8a5a2b]">
    //           Firebase 설정이 완료되어야 로그인 기능을 사용할 수 있습니다.
    //         </p>
    //       ) : !isReady ? (
    //         <p className="mt-2 leading-7 text-[#6f4a38]">로그인 상태를 확인하는 중입니다...</p>
    //       ) : user ? (
    //         <>
    //           <p className="mt-2 leading-7 text-[#6f4a38]">
    //             현재 계정: <strong>{user.email ?? '이메일 정보 없음'}</strong>
    //           </p>
    //           <p className="mt-1 leading-7 text-[#6f4a38]">
    //             {isAdmin
    //               ? '이 계정은 관리자 권한이 있어 게시글 작성과 삭제를 사용할 수 있습니다.'
    //               : '로그인되어 있지만 관리자 목록에 없는 계정입니다. 관리자 이메일을 환경변수에 추가해주세요.'}
    //           </p>
    //           <button
    //             type="button"
    //             onClick={() => void handleSignOut()}
    //             className="mt-4 rounded-full border border-[#d9b7a3] px-4 py-2 text-sm font-semibold text-[#5d3322] transition hover:bg-[#fff1e7]"
    //           >
    //             로그아웃
    //           </button>
    //         </>
    //       ) : (
    //         <>
    //           <p className="mt-2 leading-7 text-[#6f4a38]">
    //             Google 계정으로 로그인한 뒤, 관리자 이메일과 일치하면 글 작성 및 삭제가
    //             활성화됩니다.
    //           </p>
    //           <button
    //             type="button"
    //             onClick={() => void handleSignIn()}
    //             className="mt-4 rounded-full bg-[#35170f] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
    //           >
    //             Google로 로그인
    //           </button>
    //         </>
    //       )}
    //     </div>

    //     {message ? <p className="mt-4 leading-6 text-[#6f4a38]">{message}</p> : null}
    //   </article>

    //   <article className="rounded-[28px] border border-[rgba(155,95,61,0.14)] bg-white/90 p-6 shadow-[0_18px_60px_rgba(88,47,27,0.08)] backdrop-blur sm:p-8">
    //     <div className="flex items-end justify-between gap-3">
    //       <div>
    //         <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#35170f]">
    //           게시글 삭제
    //         </h2>
    //         <p className="mt-2 text-base leading-7 text-[#6f4a38]">
    //           관리 페이지에서는 저장된 글을 바로 제거할 수 있습니다.
    //         </p>
    //       </div>
    //       <div className="rounded-2xl bg-[#fff4ec] px-4 py-3 text-sm text-[#7b4d3a]">
    //         총 {posts.length}개
    //       </div>
    //     </div>

    //     {!isFirebaseConfigured ? (
    //       <p className="mt-6 rounded-2xl border border-[#f0cfab] bg-[#fff5eb] px-4 py-4 leading-7 text-[#8a5a2b]">
    //         Firebase 설정값이 비어 있어서 관리 기능을 사용할 수 없습니다.
    //       </p>
    //     ) : null}

    //     {loading ? <p className="mt-6 text-[#6f4a38]">관리 목록을 불러오는 중입니다...</p> : null}
    //     {!loading && isFirebaseConfigured && posts.length === 0 ? (
    //       <p className="mt-6 text-[#6f4a38]">삭제할 게시글이 아직 없습니다.</p>
    //     ) : null}

    //     <ul className="mt-6 grid gap-3.5">
    //       {posts.map((post) => (
    //         <li
    //           key={post.id}
    //           className="rounded-[22px] border border-[#f0daca] bg-linear-to-b from-[#fff8f2] to-[#fffdfb] p-4"
    //         >
    //           <p className="text-[13px] text-[#8a6655]">{post.createdAt ?? '생성 시간 없음'}</p>
    //           <strong className="mt-2 block text-xl leading-[1.35] text-[#35170f]">
    //             {post.title}
    //           </strong>
    //           <p className="mt-2 line-clamp-3 whitespace-pre-wrap leading-7 text-[#6f4a38]">
    //             {post.content}
    //           </p>
    //           <button
    //             type="button"
    //             onClick={() => void handleDelete(post.id)}
    //             disabled={deletingId === post.id || !canManagePosts}
    //             className="mt-4 rounded-full bg-[#35170f] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    //           >
    //             {deletingId === post.id ? '삭제 중...' : '게시글 삭제'}
    //           </button>
    //         </li>
    //       ))}
    //     </ul>
    //   </article>
    // </section>
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

          <label htmlFor="content" className="text-sm font-bold text-[#5d3322]">
            내용
          </label>
          <div className="overflow-hidden rounded-2xl border border-[#dfc3ae] bg-[#fffdfa] transition focus-within:border-[#bf6a43] focus-within:ring-4 focus-within:ring-[rgba(191,106,67,0.18)]">
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

export default AdminPage
