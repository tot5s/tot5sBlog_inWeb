export type FirestoreTimestamp = {
  toDate?: () => Date
}

export interface PostItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  coverImage: string | null
  media?: Record<string, unknown>  // 빈 객체 허용
  createdAt: string
  updatedAt: string
}
