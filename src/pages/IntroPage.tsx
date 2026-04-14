import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isFirebaseConfigured } from '../firebase'
import { fetchPosts } from '../lib/posts'
import type { PostItem } from '../types/post'

function extractFirstImageSrc(html: string) {
  const match = html.match(/<img[^>]+src="([^"]+)"/i)
  return match?.[1] ?? null
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function IntroPage() {
  const [posts, setPosts] = useState<PostItem[]>([])

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const loadPosts = async () => {
      try {
        const nextPosts = await fetchPosts()

        setPosts(nextPosts)
        console.log(nextPosts)
      } catch (e) {
        console.log(e)
      }
    }

    void loadPosts()
  }, [])

  return (
    <div className='bg-white max-h-screen overflow-auto h-[calc(100vh_-_50px)]'>
      <div className='flex gap-5 px-4 py-4 border-b border-neutral-200'>
        <div>
          <div className='bg-gray-100 w-20 h-20 rounded-full overflow-hidden'>
            <img src="" alt="" className='w-full h-full object-cover rounded-full'/>
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

      <div className='mx-auto flex max-w-[560px] flex-col gap-5 px-3 py-5'>
        {posts.map((p) => {
          const previewImage = extractFirstImageSrc(p.content)
          const previewText = stripHtml(p.content)

          return (
            <Link
              key={p.id}
              to={`/posts/${p.id}`}
              className='block overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
            >
              <div className='flex items-center justify-between px-4 py-3.5'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white'>
                    T5
                  </div>
                  <div>
                    <div className='text-sm font-semibold text-neutral-900'>tot5s</div>
                    <div className='text-xs text-neutral-400'>{p.createdAt}</div>
                  </div>
                </div>
                <button id='edit_btn' type='button' className='text-xl leading-none text-neutral-400'>
                  ...
                </button>
              </div>

              {previewImage ? (
                <div className='aspect-square overflow-hidden bg-neutral-100'>
                  <img
                    src={previewImage}
                    alt={p.title}
                    className='h-full w-full object-cover transition duration-500 hover:scale-[1.03]'
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

              <div className='px-4 pb-5 pt-4'>
                <div className='flex items-center gap-4 text-[22px] text-neutral-800'>
                  <button type='button'>♡</button>
                  <button type='button'>💬</button>
                  <button type='button'>↗</button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default IntroPage
