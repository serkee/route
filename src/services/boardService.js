
import { db } from '@/firebase'; // Firebase 서비스 인스턴스 import
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';


// 게시글 목록을 가져오는 함수
const getPosts = async () => {
  try {
    const postsCollectionRef = collection(db, 'posts'); // 'posts' 컬렉션 참조
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc')); // 최신순 정렬 쿼리
    const querySnapshot = await getDocs(q); // 쿼리 실행하여 문서 스냅샷 가져오기

    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() }); // 문서 ID와 데이터 추출
    });

    return posts; // 게시글 배열 반환
  } catch (error) {
    console.error("게시글 목록 가져오기 오류:", error);
    throw error; // 오류를 다시 throw하여 호출한 곳에서 처리하도록 합니다.
  }
};

// 특정 게시글 상세 정보를 가져오는 함수 (getPostDetail 대신 이 이름 사용 권장)
const getPostById = async (postId) => {
    try {
        // db 인스턴스와 import된 doc, getDoc 함수를 사용합니다.
        const postDocRef = doc(db, 'posts', postId); // 특정 문서 참조
        const postDocSnap = await getDoc(postDocRef); // 문서 내용 가져오기

        if (postDocSnap.exists()) {
            return { id: postDocSnap.id, ...postDocSnap.data() }; // 문서가 존재하면 ID와 데이터 반환
        } else {
            console.log("해당 게시글이 존재하지 않습니다.");
            return null; // 문서가 없으면 null 반환
        }
    } catch (error) {
        console.error(`게시글 ${postId} 가져오기 오류:`, error);
        throw error;
    }
};

// 게시글에 댓글을 추가하는 함수 (로직은 귀하의 코드를 참고하여 채워 넣으세요)
const addCommentToPost = async (postId, commentData) => {
    try {
        // 예시: 댓글 컬렉션 경로: posts/{postId}/comments
        const commentsCollectionRef = collection(db, 'posts', postId, 'comments');

        // 댓글 데이터에 작성자 정보, 타임스탬프 등을 추가해야 합니다.
        const commentToAdd = {
            ...commentData, // 전달받은 댓글 내용
            // authorId: ..., // 작성자 UID (여기서 가져오거나 호출하는 쪽에서 전달)
            // authorName: ..., // 작성자 이름 등 (여기서 가져오거나 호출하는 쪽에서 전달)
            createdAt: serverTimestamp() // 서버 타임스탬프
        };

        const docRef = await addDoc(commentsCollectionRef, commentToAdd); // 댓글 문서 추가
        console.log(`게시글 ${postId}에 댓글 추가 완료. 댓글 ID: ${docRef.id}`);
        return docRef.id; // 추가된 댓글 문서 ID 반환

    } catch (error) {
        console.error(`게시글 ${postId}에 댓글 추가 오류:`, error);
        throw error;
    }
};

// 게시글을 삭제하는 함수 (로직은 귀하의 코드를 참고하여 채워 넣으세요)
const deletePost = async (postId) => {
    try {
        // db 인스턴스와 import된 doc, deleteDoc 함수를 사용합니다.
        const postDocRef = doc(db, 'posts', postId); // 삭제할 문서 참조
        await deleteDoc(postDocRef); // 문서 삭제 실행

        console.log(`게시글 ${postId} 삭제 완료.`);

        // 참고: 게시글 삭제 시 해당 게시글의 모든 하위 컬렉션(예: 댓글) 문서들도 직접 삭제해야 합니다.
        // Firestore는 문서 삭제 시 하위 컬렉션을 자동으로 삭제하지 않습니다.
        // 댓글 삭제 로직 등을 여기에 추가해야 할 수 있습니다.

    } catch (error) {
        console.error(`게시글 ${postId} 삭제 오류:`, error);
        throw error;
    }
};


// 게시글 관련 서비스 함수들을 내보냅니다.
// BoardDetailView.vue 등의 파일에서 이 함수들을 import하여 사용합니다.
export {
  getPosts,
  getPostById,      // BoardDetailView.vue에서 getPostDetail 대신 이 이름을 사용해야 합니다.
  addCommentToPost, // BoardDetailView.vue에서 import하려던 함수
  deletePost        // BoardDetailView.vue에서 import하려던 함수
};