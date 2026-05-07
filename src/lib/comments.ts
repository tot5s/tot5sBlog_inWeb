import dayjs from "dayjs"
import type { FirestoreTimestamp } from "../types/post"
import { db } from "../firebase"
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, where, type Unsubscribe } from "firebase/firestore"




const COMMENTS_COLLECTION = 'comments'
const DATE_FORMAT = 'YYYY.MM.DDTHH:mm:ss'


type CommentDocument = {
    postId: string,
    nickname: string,
    content: string,
    createdAt?: FirestoreTimestamp | string | Date | null,
    parentId?: string | null
}


export type CommentItem = {
    id: string,
    postId: string,
    nickname: string,
    content: string,
    createdAt: string,
    parentId: string | null
}

function formatCommentDate(value?: CommentDocument['createdAt']) {
    if(!value) {
        return '날짜 없음'
    }

    if (typeof value == 'string') {
        return dayjs(value).isValid() ? dayjs(value).format(DATE_FORMAT) : value
    }

    if (value instanceof Date) {
        return dayjs(value).format(DATE_FORMAT)
    }

    if(typeof value == 'object' && typeof value.toDate == 'function') {
        return dayjs(value.toDate()).format(DATE_FORMAT)
    }

    return '날짜 없음'
}

const mapComment = (
    id: string,
    data: CommentDocument,
) : CommentItem => ({
    id,
    postId: data.postId,
    nickname: data.nickname,
    content: data.content,
    createdAt: formatCommentDate(data.createdAt),
    parentId: data.parentId ?? null
})

// 댓글 조회
export async function fetchComment(postId: string) {
    if(!db) {
        throw new Error('Firebase is not configured')
    }

    const commentsRef = collection(db, COMMENTS_COLLECTION)
    const commentsQuery = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
    )

    const snapshot = await getDocs(commentsQuery)
    const comments : CommentItem[] = []

    snapshot.forEach((snapshotDoc) => {
        const comment = mapComment(snapshotDoc.id, snapshotDoc.data() as CommentDocument)


        comments.push(comment)
    })

    return comments
}

// 실시간 댓글

export function subscriptionToComment(
    postId:string, 
    callback: (comments: CommentItem[]) => void
): Unsubscribe {
    if(!db) {
        throw new Error("firebase is not configured");   
    }

    const commentsRef = collection(db, COMMENTS_COLLECTION)
    const commentsQuery = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
    )

    return onSnapshot(commentsQuery, (sn) => {
        const comments: CommentItem[] =[]
        sn.forEach((snd) => {
            const comment = mapComment(snd.id, snd.data() as CommentDocument)

            comments.push(comment)
        });

        callback(comments)
    })
}

// 댓글 작성

export async function createComment(postId:string, nickname: string, content: string, parentId?: string | null) {
    
    if(!db) {
        throw new Error('Firebase is no configured')
    }

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
        postId,
        nickname: nickname.trim(),
        content: content.trim(),
        createdAt: dayjs().format(DATE_FORMAT),
        parentId: parentId ?? null
    })

    return {
        id: docRef.id,
        postId,
        nickname: nickname.trim(),
        content: content.trim(),
        createdAt: dayjs().format(DATE_FORMAT),
        parentId: parentId ?? null,
    } satisfies CommentItem
}


// 댓글 삭제

export async function removeComment(commentId:string) {
    if(!db) {
        throw new Error ('Firebase is not configured')
    }

    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId))
}

// 대댓 조회

export async function fetchReplies(parentId:string) {
    if(!db) {
        throw new Error('Firebase is not configured')
    }

    const commentsRef = collection(db, COMMENTS_COLLECTION)
    const repliesQuery = query(
        commentsRef,
        where('parentId', '==', parentId),
        orderBy('createdAt', 'asc')
    )

    const snapshot = await getDocs(repliesQuery)
    const replies: CommentItem[] = []

    snapshot.forEach((sn) => {
        const reply = mapComment(sn.id, sn.data() as CommentDocument)
        replies.push(reply)
    })

    return replies
}
