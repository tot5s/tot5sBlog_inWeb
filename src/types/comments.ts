export interface Comment {
  id: string;
  postId: string;
  nickname: string;
  content: string;
  createdAt: any;
  parentId?: string | null;  // 대댓글용 (null이면 최상위 댓글)
}
 
export interface CommentsProps {
  postId: string;
}

