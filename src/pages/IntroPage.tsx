import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isFirebaseConfigured } from '../firebase'
import { useAuth } from '../auth-context'
import { fetchPosts, formatDateForDisplay, removePost } from '../lib/posts'
import type { PostItem } from '../types/post';

import { HiDotsVertical } from 'react-icons/hi';
import { FaRegHeart, FaRegCommentDots } from 'react-icons/fa';



function extractFirstImageSrc(html: string) {
  const match = html.match(/<img[^>]+src="([^"]+)"/i)
  return match?.[1] ?? null
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function IntroPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const loadPosts = async () => {
      try {
        const nextPosts = await fetchPosts()

        setPosts(nextPosts)

      } catch (e) {
        console.log(e)
      }
    }

    void loadPosts()
  }, [])

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
      // 삭제 로직 구현 (예: Firestore에서 해당 게시글 삭제)
      await removePost(post.id)
      // 삭제 후 게시글 목록 새로고침
      const nextPosts = await fetchPosts()
      setPosts(nextPosts)
    }
    
  }

  return (
    <div className='bg-white max-h-screen overflow-auto h-[calc(100vh_-_50px)]'>
      {
        isAdmin ? (
          <div className='flex gap-5 px-4 py-4 border-b border-neutral-200'>
            <Link to="/admin" className='flex items-center gap-3'>
              <div className='bg-gray-100 w-20 h-20 rounded-full overflow-hidden'>
                <img src="./profile.jpg" alt="" className='w-full h-full object-cover rounded-full'/>
              </div>
              <div>
                <div className='text-sm font-semibold text-neutral-900'>tot5s</div>
                <div className='text-xs text-neutral-400'>관리자</div>
              </div>
            </Link>
          </div>
        ) : (
        <div className='flex gap-5 px-4 py-4 border-b border-neutral-200'>
          <div>
            <div className='bg-gray-100 w-20 h-20 rounded-full overflow-hidden'>
              <img src="./profile.jpg" alt="" className='w-full h-full object-cover rounded-full'/>
            </div>
          </div>
          <div>
            <div>
              nickname:
            </div>
            <div className='text-sm text-neutral-500'>
              Lorem ipsum dolor sit amet consectetur adipiscing elit quisque himenaeos, condimentum bibendum sociosqu commodo platea magna donec ullamcorper, augue diam libero vulputate dui odio metus hac. Ligula potenti habitasse fringilla risus ac posuere dictum lobortis, imperdiet litora malesuada donec facilisi id scelerisque, orci pellentesque nullam erat habitant tortor porttitor.
            </div>
          </div>
        </div>
        )
      }
     

      <div className='mx-auto flex max-w-[560px] flex-col gap-5 px-3 py-5'>
        {posts.map((p, idx) => {
          const previewImage = extractFirstImageSrc(p.content)
          const previewText = stripHtml(p.content)

          return (
            <div key={p.id} className='overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]'>
              <div className='flex items-center justify-between px-4 py-3.5'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white'>
                    T5
                  </div>
                  <div>
                    <div className='text-sm font-semibold text-neutral-900'>tot5s</div>
                    <div className='text-xs text-neutral-400'>{formatDateForDisplay(p.createdAt)}</div>
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
                <div className='flex aspect-square items-end bg-linear-to-br from-[#f8efe8] via-[#f7f7f7] to-[#ece7ff] p-6'>
                  <div className='max-w-[80%]'>
                    <div className='text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400'>
                      Post
                    </div>
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
                  <button type='button'><FaRegHeart /></button>
                  <button type='button'>
                    <FaRegCommentDots />
                  </button>
                  {/* <button type='button'>
                    <FaRepeat />
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
