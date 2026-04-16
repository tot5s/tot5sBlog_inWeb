import {
  addDoc,
  collection,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { FirestoreTimestamp, PostItem } from '../types/post'
import dayjs from 'dayjs'

const POSTS_COLLECTION = 'posts'
const DATE_FORMAT = 'YYYY.MM.DDTHH:mm:ss' // 저장용
const DISPLAY_FORMAT = 'YYYY.MM.DD' // 표시용

type PostDocument = {
  title: string
  content: string
  category: string
  tags?: string[]
  coverImage?: string | null
  createdAt?: FirestoreTimestamp | string | Date | null
  updatedAt?: FirestoreTimestamp | string | Date | null
}

function formatPostDate(value?: PostDocument['createdAt']) {
  if (!value) {
    return '날짜 없음'
  }

  if (typeof value === 'string') {
    return dayjs(value).isValid() ? dayjs(value).format(DATE_FORMAT) : value
  }

  if (value instanceof Date) {
    return dayjs(value).format(DATE_FORMAT)
  }

  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return dayjs(value.toDate()).format(DATE_FORMAT)
  }

  return '날짜 없음'
}

// 표시용 포맷팅 함수
export function formatDateForDisplay(dateString: string): string {
  if (!dateString || dateString === '날짜 없음') {
    return '생성 시간 없음'
  }
  // YYYY.MM.DDTHH:mm:ss 형식을 YYYY-MM-DD로 변환
  const normalizedDate = dateString.replace(/\./g, '-')
  return dayjs(normalizedDate).isValid() ? dayjs(normalizedDate).format('YYYY.MM.DD') : dateString
}

const mapPost = (
  id: string,
  data: PostDocument,
): PostItem => ({
  id,
  title: data.title ?? '제목 없음',
  content: data.content ?? '',
  category: data.category,
  tags: data.tags || [],
  coverImage: data.coverImage || null,
  createdAt: formatPostDate(data.createdAt),
  updatedAt: formatPostDate(data.updatedAt),
})

export async function fetchPosts() {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const postsRef = collection(db, POSTS_COLLECTION)
  const postsQuery = query(postsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(postsQuery)

  return snapshot.docs.map((snapshotDoc) =>
    mapPost(snapshotDoc.id, snapshotDoc.data() as Parameters<typeof mapPost>[1]),
  )
}

export async function fetchPostById(postId: string) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const snapshot = await getDoc(doc(db, POSTS_COLLECTION, postId))

  if (!snapshot.exists()) {
    return null
  }

  return mapPost(snapshot.id, snapshot.data() as PostDocument)
}

export async function createPost(
  title: string, 
  content: string,
  category: string,
  tags?: string[],
  coverImage?: string | null
) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    title,
    content,
    category,
    tags: tags || [],
    coverImage: coverImage || null,
    media: {},  // 빈 객체로 초기화
    createdAt: dayjs().format(DATE_FORMAT),
    updatedAt: dayjs().format(DATE_FORMAT),
  })

  return {
    id: docRef.id,
    title,
    content,
    category,
    tags: tags || [],
    coverImage: coverImage || null,
    createdAt: '방금 전',
    updatedAt: '방금 전',
  } satisfies PostItem
}

export async function updatePost(
  postId: string,
  title: string,
  content: string,
  category: string,
  tags?: string[],
  coverImage?: string | null
) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }
  
  const postRef = doc(db, POSTS_COLLECTION, postId)
  await updateDoc(postRef, {
    title,
    content,
    category,
    tags: tags || [],
    coverImage: coverImage || null,
    updatedAt: dayjs().format(DATE_FORMAT),
  })

  const updatedPost = await getDoc(postRef)

  if (!updatedPost.exists()) {
    throw new Error('업데이트된 게시글을 찾을 수 없습니다.')
  }

  return mapPost(updatedPost.id, updatedPost.data() as PostDocument)  
}


export async function removePost(postId: string) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  await deleteDoc(doc(db, POSTS_COLLECTION, postId))
}
