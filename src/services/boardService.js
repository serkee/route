
import { db } from '@/firebase'; // Firebase 서비스 인스턴스 import
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc, increment
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
  console.log(`[boardService] addCommentToPost 시작. postId: ${postId}, commentData:`, commentData); // <--- 로그 추가

  try {
      const commentsCollectionRef = collection(db, 'posts', postId, 'comments');

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
          console.error("[boardService] 댓글 작성: 사용자 로그인되지 않음."); // <--- 로그 추가
          throw new Error("댓글 작성은 로그인 후 가능합니다.");
      }
      console.log("[boardService] 사용자 로그인 확인:", user.uid); // <--- 로그 추가


      const commentToAdd = {
          ...commentData,
          authorId: user.uid,
          authorName: user.displayName || user.email || '익명',
          createdAt: serverTimestamp()
      };
      console.log("[boardService] Firestore에 추가할 댓글 데이터:", commentToAdd); // <--- 로그 추가


      // Firestore에 새 댓글 문서 추가
      console.log(`[boardService] 댓글 문서 addDoc 시도: posts/${postId}/comments`); // <--- 로그 추가
      const docRef = await addDoc(commentsCollectionRef, commentToAdd);
      console.log(`[boardService] 댓글 문서 addDoc 성공. 문서 ID: ${docRef.id}`); // <--- 로그 추가

      // *** 부모 게시글의 commentCount 필드 1 증가 로직 ***
      console.log(`[boardService] commentCount 업데이트 시도: posts/${postId}`); // <--- 로그 추가
      try {
           const postRef = doc(db, 'posts', postId);
           console.log("[boardService] 게시글 문서 참조 생성 완료."); // <--- 로그 추가
           await updateDoc(postRef, {
               commentCount: increment(1)
           });
           console.log(`[boardService] commentCount 1 증가 updateDoc 성공.`); // <--- 로그 추가
      } catch (updateError) {
           console.error(`[boardService] commentCount 업데이트 updateDoc 오류:`, updateError); // <--- 로그 추가 (오류 객체 포함)
           // 여기서 오류가 발생하는지 확인합니다.
      }

      console.log("[boardService] addCommentToPost 완료."); // <--- 로그 추가
      return docRef.id;

  } catch (error) {
      console.error("[boardService] addCommentToPost 전체 오류:", error); // <--- 로그 추가 (전체 오류 객체 포함)
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