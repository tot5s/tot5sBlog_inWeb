import React, { useEffect, useRef, useState} from "react"
import { useAuth } from "../auth-context"
import type { CommentItem } from "../lib/comments"
import { createComment, removeComment, subscriptionToComment } from "../lib/comments"
import { formatDateForDisplay } from "../lib/posts"

interface CommentProps {
    postId: string
}


function Comments({postId} : CommentProps) {
    const { isAdmin } = useAuth()
    const [comments, setComments] = useState<CommentItem[]>([])
    const [nickname, setNickname] = useState('')
    const [content, setContent] = useState('')

    const [replyTo, setReplyTo] = useState<string|null>(null)
    const [replyNickname, setReplyNickname] = useState('')
    const [replyContent, setReplyContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
    const mobileListRef = useRef<HTMLDivElement | null>(null)


    useEffect(() => {
        const unsubscribe = subscriptionToComment(postId, (commentList) => {
            setComments(commentList)
        })

        return () => unsubscribe()
    }, [postId])

    const topLvComments = comments.filter(c => !c.parentId)

    const getReplies = (commentId: string) => {
      return comments.filter(c => c.parentId === commentId)
    }

    const resetIosZoom = () => {
      if (typeof window === 'undefined') {
        return
      }

      const activeElement = document.activeElement
      if (activeElement instanceof HTMLElement) {
        activeElement.blur()
      }

      window.setTimeout(() => {
        window.scrollTo(0, window.scrollY)
      }, 50)
    }

    const scrollMobileListToTop = () => {
      mobileListRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if(!nickname.trim() || !content.trim()) {
            alert('닉네임 혹은 내용을 입력해주세요')
            return;
        }
        
        setLoading(true)

        try{
            await createComment(postId, nickname, content);

            setNickname('')
            setContent('')
            
        } catch(e) {
            console.log(e)
        } finally {
            setLoading(false)
            setOpen(false)
            resetIosZoom()
            scrollMobileListToTop()
        }
    }

    const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
      e.preventDefault();

      if( !replyNickname.trim() || !replyContent.trim()) {
        alert(
          '닉네임 혹은 내용을 입력해주세요.'
        )
        return;
      }

      setLoading(true)

      try {
        await createComment(postId, replyNickname, replyContent, parentId)

        setReplyNickname('')
        setReplyContent('')
        setReplyTo(null)
      } catch (e) {
        console.log(e)
      } finally {
        setLoading(false)
        resetIosZoom()
        scrollMobileListToTop()
      }
    }

    const handleRemove = async (commendId: string) => {
        if(!isAdmin) return

        if(!confirm('댓글을 삭제 하시겠습니까?')) return;

        setLoading(true)
        try {
            await removeComment(commendId)
        } catch (e) {
            console.log(e)
        } finally{
            setLoading(false)
        }
    }

    const renderCommentList = () => (
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-gray-400">첫 댓글을 작성해보세요</p>
        ) : (
          topLvComments.map((comment) => {
            const replies = getReplies(comment.id)
            
            return (
               <div
              key={comment.id}
              className="rounded-lg bg-gray-50 p-4 transition hover:bg-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {comment.nickname}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateForDisplay(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700">
                    {comment.content}
                  </p>
                </div>
                <button onClick={() => setReplyTo(replyTo == comment.id ? null : comment.id)} className="text-xs text-[#bf5a43] hover:text-[#a85b36] mt-2">
                  {replyTo == comment.id ? '취소' : '답글'}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleRemove(comment.id)}
                    className="ml-2 text-xs mt-2 text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
                
              </div>

              {/* 대댓글 입력 폼 */}
              {
                replyTo === comment.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, comment.id)}
                  className="mt-4 ml-4 space-y-2 border-l-2 border-[#bf6a43] pl-4">
                     <input
                        type="text"
                        value={replyNickname}
                        onChange={(e) => setReplyNickname(e.target.value)}
                        placeholder="닉네임"
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#bf6a43]"
                        maxLength={20}
                      />
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글을 입력하세요"
                        rows={2}
                        className="w-full resize-none rounded border border-gray-300 px-3 py-1.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#bf6a43]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-[#bf6a43] text-white rounded hover:bg-[#a85b36] disabled:opacity-50"
                        >
                          {loading ? '작성 중...' : '답글 작성'}
                        </button>
                      </div>
                  </form>
                )
              }   
               {/* 대댓글 목록 */}
              {replies.length > 0 && (
                <div className="ml-8 mt-2 space-y-2">
                  {replies.map((re) => (
                    <div key={re.id} className="bg-gray-100 rounded-lg p-3 hover:bg-gray-200 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semigold text-gray-800">
                              {re.nickname}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateForDisplay(re.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {re.content}
                          </p>
                        </div>
                        {
                          isAdmin && (
                            <button onClick={() => handleRemove(re.id)} className="text-red-500 hover:text-red-700 text-xs ml-2">삭제</button>
                          )
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}           
            </div>
            )
          })
        )}
      </div>
    )

    const renderCommentForm = () => (
      !open ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => { setOpen(true) }}
            className="rounded-lg bg-[#bf6a43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a85b36]"
          >
            댓글 쓰기
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#bf6a43]"
            maxLength={20}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#bf6a43]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#bf6a43] px-6 py-2 text-white transition hover:bg-[#a85b36] disabled:opacity-50"
            >
              {loading ? '작성 중...' : '댓글 작성'}
            </button>
          </div>
        </form>
      )
    )

    return (
      <>
        <div className="mt-8 hidden md:block">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            댓글 {comments.length}
          </h3>
          {renderCommentList()}
          <div className="mt-6">
            {renderCommentForm()}
          </div>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#35170f] px-5 py-3 text-sm font-semibold text-white shadow-lg"
          >
            댓글
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
              {comments.length}
            </span>
          </button>

          {mobileSheetOpen ? (
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                aria-label="댓글 창 닫기"
                onClick={() => setMobileSheetOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <div className="absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col rounded-t-3xl bg-white px-5 pb-6 pt-4 shadow-2xl">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">
                    댓글 {comments.length}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileSheetOpen(false)}
                    className="text-sm text-gray-500"
                  >
                    닫기
                  </button>
                </div>
                <div
                  ref={mobileListRef}
                  className="min-h-0 flex-1 overflow-y-auto pr-1"
                >
                  {renderCommentList()}
                </div>
                <div className="mt-5 shrink-0 border-t border-gray-100 pt-4">
                  {renderCommentForm()}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </>
    )

}

export default Comments
