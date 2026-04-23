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
  limit,
  startAfter,
  increment,
  where,
  startAt,
  endAt,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { FirestoreTimestamp, PostItem } from '../types/post'
import dayjs from 'dayjs'

const POSTS_COLLECTION = 'posts'
const DATE_FORMAT = 'YYYY.MM.DDTHH:mm:ss' // 저장용

type PostDocument = {
  title: string
  titleLowercase?: string
  content: string
  category: string
  isPrivate?: boolean
  password?: string | null
  tags?: string[]
  coverImage?: string | null
  createdAt?: FirestoreTimestamp | string | Date | null
  updatedAt?: FirestoreTimestamp | string | Date | null
  likeCount?: number
  viewCount?: number
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

type FetchPostsOptions = {
  category?: string
  keyword?: string
}

function normalizeTitleSearch(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

// 표시용 포맷팅 함수
export function formatDateForDisplay(dateString: string): string {
  if (!dateString || dateString === '날짜 없음') {
    return '생성 시간 없음'
  }
  // 시간 상대 표시 (예: "방금 전", "5분 전", "2시간 전", "3일 전")
  const now = dayjs()
  const postDate = dayjs(dateString.replace(/\./g, '-')) // 날짜 구분자 통일

  const diffInSeconds = now.diff(postDate, 'second')
  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = now.diff(postDate, 'minute')
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = now.diff(postDate, 'hour')
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }
  
  const diffInDays = now.diff(postDate, 'day')
  if (diffInDays < 7) {
    return `${diffInDays}일 전`
  }

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
  isPrivate: data.isPrivate ?? false,
  password: data.password ?? null,
  tags: data.tags || [],
  coverImage: data.coverImage || null,
  createdAt: formatPostDate(data.createdAt),
  updatedAt: formatPostDate(data.updatedAt),
  likeCount: data.likeCount ?? 0, // 좋아요 수 초기값
  viewCount: data.viewCount ?? 0, // 조회수 초기값
})

export async function fetchPosts(options: FetchPostsOptions = {}) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const postsRef = collection(db, POSTS_COLLECTION)
  const normalizedKeyword = normalizeTitleSearch(options.keyword)
  const constraints: QueryConstraint[] = []

  if (options.category && options.category !== 'all') {
    constraints.push(where('category', '==', options.category))
  }

  if (normalizedKeyword) {
    constraints.push(orderBy('titleLowercase'))
    constraints.push(startAt(normalizedKeyword))
    constraints.push(endAt(`${normalizedKeyword}\uf8ff`))
  } else {
    constraints.push(orderBy('createdAt', 'desc'))
  }

  constraints.push(limit(10))

  const postsQuery = query(postsRef, ...constraints)
  const snapshot = await getDocs(postsQuery)

  // return snapshot.docs.map((snapshotDoc) =>
  //   mapPost(snapshotDoc.id, snapshotDoc.data() as Parameters<typeof mapPost>[1]),
  // )
  const posts: PostItem[] = []
  snapshot.forEach((snapshotDoc) => {
    const post = mapPost(snapshotDoc.id, snapshotDoc.data() as Parameters<typeof mapPost>[1])
    posts.push(post)
  })

  return posts
}

export async function morePosts(lastCreatedAt: string) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const postsRef = collection(db, POSTS_COLLECTION)
  const postsQuery = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    startAfter(lastCreatedAt),
    limit(10)
  )
  const snapshot = await getDocs(postsQuery)

  const posts: PostItem[] = []
  snapshot.forEach((snapshotDoc) => {
    const post = mapPost(snapshotDoc.id, snapshotDoc.data() as Parameters<typeof mapPost>[1])
    posts.push(post)
  })

  return posts
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
  isPrivate = false,
  password?: string | null,
  tags?: string[],
  coverImage?: string | null
) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    title,
    titleLowercase: normalizeTitleSearch(title),
    content,
    category,
    isPrivate,
    password: isPrivate ? password?.trim() || null : null,
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
    isPrivate,
    password: isPrivate ? password?.trim() || null : null,
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
  isPrivate = false,
  password?: string | null,
  tags?: string[],
  coverImage?: string | null
) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }
  
  const postRef = doc(db, POSTS_COLLECTION, postId)
  await updateDoc(postRef, {
    title,
    titleLowercase: normalizeTitleSearch(title),
    content,
    category,
    isPrivate,
    password: isPrivate ? password?.trim() || null : null,
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


export async function likePost(postId: string) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const postRef = doc(db, POSTS_COLLECTION, postId)
  await updateDoc(postRef, {
    likeCount: increment(1),
  })
}

export async function viewPost(postId: string) {
  if (!db) {
    throw new Error('Firebase is not configured')
  }

  const postRef = doc(db, POSTS_COLLECTION, postId)
  await updateDoc(postRef, {
    viewCount: increment(1),
  })
}
