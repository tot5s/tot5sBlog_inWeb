import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isFirebaseConfigured } from '../firebase'
import { useAuth } from '../auth-context'
import { fetchPosts, formatDateForDisplay, removePost, likePost } from '../lib/posts'
import type { PostItem } from '../types/post';

import { HiDotsVertical } from 'react-icons/hi';
import { FaRegHeart } from 'react-icons/fa';

import { getAdminData } from '../lib/admin'

const categoryFilters = [
  { id: 'all', name: '전체' },
  { id: 'daily', name: '일상' },
  { id: 'tech', name: '기술' },
  { id: 'travel', name: '여행' },
  { id: 'food', name: '음식' },
  { id: 'thoughts', name: '생각' },
]

function extractFirstImageSrc(html: string) {
  const match = html.match(/<img[^>]+src="([^"]+)"/i)
  return match?.[1] ?? null
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function IntroPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [likingPostId, setLikingPostId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const { isAdmin } = useAuth()
  const [ userData, setUserData ] = useState<{ nickname: string, bio: string, profileImageUrl: string } | null>(null)
  const navigate = useNavigate()

  
  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

     const loadAdminData = async () => {
      try {
        const data = await getAdminData()
        if (data) {
          setUserData(data)
        }
      } catch (error) {
        console.error("Error loading admin data:", error)
      }
    }
    void loadAdminData()

  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const loadPosts = async () => {
      setIsLoadingPosts(true)
      try {
        const nextPosts = await fetchPosts({
          category: selectedCategory,
          keyword: searchKeyword,
        })
        setPosts(nextPosts)
      } catch (e) {
        console.log(e)
      } finally {
        setIsLoadingPosts(false)
      }
    }

    void loadPosts()
  
  }, [selectedCategory, searchKeyword])

  const openEdit = (idx: number) => {
    const menu = document.getElementById(`edit_menu_${idx}`)
    if (menu) {
      menu.classList.toggle('hidden')
    }
  }

  const editPost = (post: PostItem) => {
    navigate(`/posts/write?postId=${post.id}`)
    
  }

  const delPost = async (post: PostItem) => {
    if (window.confirm('게시글을 삭제하시겠습니까?')) {
      await removePost(post.id)
      const nextPosts = await fetchPosts({
        category: selectedCategory,
        keyword: searchKeyword,
      })
      setPosts(nextPosts)
    }
    
  }

  const handleLike = async(postId: string) => {
    if (likingPostId === postId) {
      return
    }

    setLikingPostId(postId)
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, likeCount: (post.likeCount ?? 0) + 1 }
          : post,
      ),
    )

    try {
      await likePost(postId)
    } catch (error) {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, likeCount: Math.max((post.likeCount ?? 1) - 1, 0) }
            : post,
        ),
      )
      console.error('좋아요 처리 중 오류 발생:', error)
    } finally {
      setLikingPostId(null)
    }
  }

  return (
    <div className='bg-[#f6f6f6] max-h-screen overflow-y-auto pb-4 h-[calc(100vh_-_50px)]'>
      {
        isAdmin ? (
          <div className=' px-8 py-4 border-b bg-white border-neutral-200'>
            <Link to="/admin" className=''>
              <div className='bg-gray-100 w-16 h-16 rounded-full overflow-hidden'>
                <img src={userData?.profileImageUrl || "./profile.jpg"} alt="" className='w-full h-full object-cover rounded-full'/>
              </div>
              <div>
                <div className='text-sm font-semibold text-neutral-900'>{userData?.nickname || 'Admin'}</div>
                <div className='text-sm text-neutral-500'>{userData?.bio || '관리자 프로필입니다.'}</div>
              </div>
            </Link>
            <div>
          <div className="flex items-center justify-start text-sm">
                <div className=''>
                  Post {posts.length}
                </div>
                  <div className='mx-2'>|</div>
                <div>
                  Like {posts.reduce((sum, post) => sum + (post.likeCount ?? 0), 0)}
                </div>
                  <div className='mx-2'>|</div>
                <div>
                  View {posts.reduce((sum, post) => sum + (post.viewCount ?? 0), 0)}
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className=' px-4 py-4 border-b bg-white border-neutral-200'>
          <div>
            <div className='bg-gray-100 w-16 h-16 rounded-full overflow-hidden'>
              <img src={userData?.profileImageUrl || "./profile.jpg"} alt="" className='w-full h-full object-cover rounded-full'/>
            </div>
          </div>
          <div>
            <div className='text-sm font-semibold text-neutral-900'>
              {userData?.nickname || 'Admin'}
            </div>
            <div className='text-sm text-neutral-500'>
              {userData?.bio || '관리자 프로필입니다.'}
            </div>
          </div>
        </div>
        )
      }
      

      <div className='mx-auto flex max-w-[560px] flex-col gap-5 px-3 py-5'>
        <div className='rounded-[28px] border border-neutral-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'>
          <label htmlFor='post-search' className='mb-2 block text-sm font-semibold text-neutral-900'>
            제목 검색
          </label>
          <input
            id='post-search'
            type='search'
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder='게시글 제목으로 검색해보세요'
            className='w-full rounded-2xl border border-[#dfc3ae] bg-[#fffdfa] px-4 py-3 text-sm text-[#35170f] outline-none transition focus:border-[#bf6a43] focus:ring-4 focus:ring-[rgba(191,106,67,0.18)]'
          />
          <div className='mt-4 flex flex-wrap gap-2'>
            {categoryFilters.map((category) => (
              <button
                key={category.id}
                type='button'
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category.id
                    ? 'border-[#bf6a43] bg-[#bf6a43] text-white'
                    : 'border-[#dfc3ae] bg-[#fffdfa] text-[#5d3322] hover:bg-[#f0e6d9]'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className='mt-3 text-sm text-neutral-500'>
            {searchKeyword ? `"${searchKeyword}" 검색 결과 ` : ''}
            총 {posts.length}개의 게시글
          </div>
        </div>

        {isLoadingPosts ? (
          <div className='rounded-[28px] border border-dashed border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-400'>
            게시글을 불러오는 중입니다.
          </div>
        ) : null}

        {!isLoadingPosts && posts.length === 0 ? (
          <div className='rounded-[28px] border border-dashed border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-400'>
            조건에 맞는 게시글이 없습니다.
          </div>
        ) : null}

        {!isLoadingPosts && posts.map((p, idx) => {
          const previewImage = extractFirstImageSrc(p.content)
          const previewText = stripHtml(p.content)

          return (
            <div key={p.id} className='overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]'>
              <div className='flex items-center justify-between px-4 py-3.5'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white'>
                    {userData?.nickname ? userData.nickname[0] : 'A'}
                  </div>
                  <div>
                    <div className='text-sm font-semibold text-neutral-900'>tot5s</div>
                    <div className='text-xs text-neutral-400'>{ formatDateForDisplay(p.createdAt)}</div>
                  </div>
                </div>
                {
                  isAdmin && (
                    <div className='relative'>
                  <button onClick={() => openEdit(idx)} id={`edit_btn_${idx}`} type='button' className='text-xl leading-none text-neutral-400 cursor-pointer'>
                    <HiDotsVertical />
                  </button>
                  <div id={`edit_menu_${idx}`} className='hidden absolute z-2 right-0 top-full mt-2 w-32 rounded-lg border border-neutral-200 bg-white shadow-lg py-1 text-sm text-neutral-700 d'>
                      <button onClick={() => editPost(p)} type='button' className='block w-full px-4 py-2 hover:bg-neutral-100 text-left'>수정</button>
                      <button onClick={() => delPost(p)} type='button' className='block w-full px-4 py-2 hover:bg-neutral-100 text-left'>삭제</button>
                    </div>
                </div>
                  )
                }
              </div>
            <Link
              key={p.id}
              to={`/posts/${p.id}`}
              className='block'
            >

              {previewImage ? (
                <div className='aspect-square overflow-hidden bg-neutral-100'>
                  <img
                    src={previewImage}
                    alt={p.title}
                    className='h-full w-full object-cover'
                  />
                </div>
              ) : (
                <div className='flex aspect-square items-end bg-linear-to-br from-[#ffe4f1] via-[#f7f7f7] to-[#ece7ff] p-6'>
                  <div className='max-w-[80%]'>
                    <div className='mt-3 text-2xl font-semibold leading-tight text-neutral-900'>
                      {p.title}
                    </div>
                    <div className='mt-3 line-clamp-3 text-sm leading-6 text-neutral-600'>
                      {previewText || '새 게시글이 업로드되었습니다.'}
                    </div>
                  </div>
                </div>
              )}
            </Link>
             <div className='px-4 pb-5 pt-4'>
                <div className='flex items-center gap-4 text-[22px] text-neutral-800'>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      className='text-lg disabled:opacity-50 cursor-pointer'
                      onClick={() => handleLike(p.id)}
                      disabled={likingPostId === p.id}
                    >
                      <FaRegHeart />
                    </button>
                    <span className='text-sm text-neutral-500'>
                      {p.likeCount}
                    </span>
                  </div>
                  {/* <button type='button'>
                    <FaRegCommentDots />
                  </button> */}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IntroPage
