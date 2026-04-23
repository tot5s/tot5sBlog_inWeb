import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { isFirebaseConfigured } from '../firebase'
import { fetchPosts, formatDateForDisplay, removePost, viewPost } from '../lib/posts'
import type { PostItem } from '../types/post'
import { useAuth } from '../auth-context'


function PostsPage() {
  const { postId } = useParams()
  const [post, setPost] = useState<PostItem | null>(null)
  const [previousPost, setPreviousPost] = useState<PostItem | null>(null)
  const [nextPost, setNextPost] = useState<PostItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const {isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isFirebaseConfigured || !postId) {
      return
    }

    const loadPost = async () => {
      setLoading(true)
      setMessage('')

      try {
        const allPosts = await fetchPosts()
        const currentIndex = allPosts.findIndex((item) => item.id === postId)

        if (currentIndex === -1) {
          setMessage('선택한 게시글을 찾지 못했습니다.')
          setPost(null)
          setPreviousPost(null)
          setNextPost(null)
          return
        }

        setPost(allPosts[currentIndex])
        setPreviousPost(currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null)
        setNextPost(currentIndex > 0 ? allPosts[currentIndex - 1] : null)
        
      } catch (error) {
        console.error(error)
        setMessage('게시글을 불러오지 못했습니다. Firestore 규칙을 확인해주세요.')
      } finally {
        setLoading(false)
      }
    }

    void loadPost()
  }, [postId])


  const editPost = () => {
    // 수정 로직 구현 (예: 게시글 수정 페이지로 이동)
    // 예시: navigate(`/edit/${post.id}`)
    navigate(`/posts/write?postId=${post?.id}`)
  }

  const delPost = async () => {
    // 삭제 로직 구현 (예: Firestore에서 해당 게시글 삭제)
    // 예시: await deletePost(post.id)
    // 삭제 후 게시글 목록 새로고침
    if (!postId) return

      if (window.confirm('게시글을 삭제하시겠습니까?')) {
        await removePost(postId)
        navigate('/')
      }
  }

  

  const handleViewCount = async () => {
    if (!postId) return
    
    try {
      await viewPost(postId)
      setPost((currentPost) =>
        currentPost
          ? { ...currentPost, viewCount: (currentPost.viewCount ?? 0) + 1 }
          : currentPost,
      )

    } catch (error) {
      console.error('Error updating view count:', error)
    }
  } 

  useEffect(() => {
    if (!isFirebaseConfigured || !postId) {
      return
    }

    void handleViewCount()
  }, [postId])

  return (
    <section className="h-[calc(100dvh_-_50px)]">
      {loading ? <p className="px-5 py-6 text-[#6f4a38]">게시글을 불러오는 중입니다...</p> : null}
      {!loading && !message && post ? (
        <article className="flex h-full flex-col bg-white p-5 sm:p-7">
          <div className='flex items-center justify-between'>
            <div>
              <p className="text-[13px] text-[#8a6655]">{
            formatDateForDisplay(post.createdAt)}</p>
            <p className="text-[13px] text-[#8a6655]">조회수: {post.viewCount}</p>
            </div>
            { isAdmin &&
              <div className='text-sm flex gap-1 text-[#6F4A37]/60'>
              <button onClick={editPost}>수정</button>
              |
              <button onClick={delPost}>삭제</button>
            </div>
            }
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-[#35170f] sm:text-3xl">
            {post.title}
          </strong>
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <div
              className="prose prose-sm max-w-none text-[#6f4a38] prose-headings:text-[#35170f] prose-p:leading-8 prose-img:max-w-full prose-img:rounded-2xl prose-img:object-contain whitespace-pre-wrap [&_img]:h-auto [&_p:empty]:min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
          <div className="mt-10 grid gap-3 border-t border-neutral-200 pt-5 sm:grid-cols-2">
            {previousPost ? (
              <Link
                to={`/posts/${previousPost.id}`}
                className="rounded-2xl border border-neutral-200 px-4 py-4 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <div className="text-xs uppercase tracking-[0.14em] text-neutral-400">이전글</div>
                <div className="mt-2 font-semibold text-neutral-900">{previousPost.title}</div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-4 text-sm text-neutral-400">
                이전글이 없습니다.
              </div>
            )}

            {nextPost ? (
              <Link
                to={`/posts/${nextPost.id}`}
                className="rounded-2xl border border-neutral-200 px-4 py-4 text-right transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <div className="text-xs uppercase tracking-[0.14em] text-neutral-400">다음글</div>
                <div className="mt-2 font-semibold text-neutral-900">{nextPost.title}</div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-4 text-right text-sm text-neutral-400">
                다음글이 없습니다.
              </div>
            )}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default PostsPage
