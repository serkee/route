// src/services/boardService.js
import { db, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "@/firebase";
import { auth } from "@/firebase"; // 현재 사용자 정보를 얻기 위해 auth 필요

const postsCollection = collection(db, "posts");

// 모든 게시글 조회 (간단 예시, 실제는 페이지네이션 필요)
const getPosts = async () => {
  const q = query(postsCollection, orderBy("createdAt", "desc")); // 최신순 정렬
  const querySnapshot = await getDocs(q);
  const posts = [];
  querySnapshot.forEach((doc) => {
    posts.push({ id: doc.id, ...doc.data() });
  });
  return posts;
};

// 특정 게시글 상세 조회
const getPostDetail = async (postId) => {
  const postDocRef = doc(db, "posts", postId);
  const postDocSnap = await getDoc(postDocRef);

  if (postDocSnap.exists()) {
    const postData = { id: postDocSnap.id, ...postDocSnap.data() };

    // 조회수 증가 (간단 예시, 실제는 트랜잭션 사용 권장)
    // updateDoc(postDocRef, { views: (postData.views || 0) + 1 }); // 이 부분은 필요에 따라 추가

    // 해당 게시글의 댓글들 조회 (comments 서브컬렉션)
    const commentsCollectionRef = collection(postDocRef, "comments");
    const commentsQuery = query(commentsCollectionRef, orderBy("createdAt", "asc")); // 댓글 작성 시간순 정렬
    const commentsSnapshot = await getDocs(commentsQuery);

    const comments = [];
    const replyMap = {}; // 답글 처리를 위한 맵

    commentsSnapshot.forEach((commentDoc) => {
      const commentData = { id: commentDoc.id, ...commentDoc.data() };
      commentData.replies = []; // 각 댓글에 답글 배열 추가

      if (commentData.parentId) {
        // 답글인 경우 부모 댓글의 replies 배열에 추가
        if (replyMap[commentData.parentId]) {
          replyMap[commentData.parentId].push(commentData);
        }
      } else {
        // 원댓글인 경우 comments 배열에 추가
        comments.push(commentData);
        replyMap[commentData.id] = commentData.replies; // 이 댓글의 답글들이 추가될 배열을 맵에 저장
      }
    });

    // comments 배열은 이제 원댓글만 가지고 있고, 각 원댓글의 replies 배열에 해당 답글들이 들어있습니다.
    return { post: postData, comments: comments };

  } else {
    console.log("게시글이 존재하지 않습니다.");
    return null;
  }
};

// 새 게시글 작성
const addPost = async (postData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("로그인이 필요합니다."); // 로그인하지 않은 경우 에러 발생
  }

  const newPost = {
    ...postData,
    authorId: currentUser.uid, // 작성자 ID
    authorName: currentUser.displayName || currentUser.email, // 작성자 이름 (프로필 설정에 따라 변경)
    createdAt: serverTimestamp(), // 서버 시간 스탬프 (시간 순서 정렬에 유리)
    updatedAt: serverTimestamp(),
    views: 0,
  };

  const docRef = await addDoc(postsCollection, newPost);
  console.log("게시글 작성 완료, ID:", docRef.id);
  return docRef.id; // 새로 생성된 게시글 ID 반환
};

// 댓글/답글 작성
const addCommentToPost = async (postId, commentText, parentId = null) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
    }

    const commentsCollectionRef = collection(db, "posts", postId, "comments");

    const newComment = {
        postId: postId, // 부모 게시글 ID
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        text: commentText,
        createdAt: serverTimestamp(),
        parentId: parentId, // 답글인 경우 부모 댓글 ID
    };

    const docRef = await addDoc(commentsCollectionRef, newComment);
    console.log("댓글/답글 작성 완료, ID:", docRef.id);
    return { id: docRef.id, ...newComment, createdAt: new Date() }; // 임시로 클라이언트 시간 사용, 실제는 Firestore에서 받아와야 정확함
};


// 게시글 수정
const updatePost = async (postId, updatedData) => {
    const postDocRef = doc(db, "posts", postId);
    // TODO: 여기서 현재 사용자가 게시글 작성자인지 확인하는 로직 추가
    // const postSnap = await getDoc(postDocRef);
    // if (postSnap.exists() && postSnap.data().authorId !== auth.currentUser?.uid) {
    //     throw new Error("수정 권한이 없습니다.");
    // }

    await updateDoc(postDocRef, {
        ...updatedData,
        updatedAt: serverTimestamp(), // 수정 시간 업데이트
    });
    console.log("게시글 수정 완료, ID:", postId);
};

// 게시글 삭제
const deletePost = async (postId) => {
    const postDocRef = doc(db, "posts", postId);
     // TODO: 여기서 현재 사용자가 게시글 작성자인지 확인하는 로직 추가
    // const postSnap = await getDoc(postDocRef);
    // if (postSnap.exists() && postSnap.data().authorId !== auth.currentUser?.uid) {
    //     throw new Error("삭제 권한이 없습니다.");
    // }

    // Firestore는 서브컬렉션을 자동으로 삭제하지 않습니다.
    // 댓글 서브컬렉션의 모든 문서를 먼저 삭제해야 합니다.
    const commentsCollectionRef = collection(postDocRef, "comments");
    const commentsSnapshot = await getDocs(commentsCollectionRef);
    const deleteCommentPromises = commentsSnapshot.docs.map(commentDoc => deleteDoc(commentDoc.ref));

    // 모든 댓글 삭제 완료 대기
    await Promise.all(deleteCommentPromises);
    console.log(`게시글 ID ${postId}의 모든 댓글 삭제 완료`);

    // 게시글 문서 삭제
    await deleteDoc(postDocRef);
    console.log("게시글 삭제 완료, ID:", postId);
};


export { getPosts, getPostDetail, addPost, addCommentToPost, updatePost, deletePost };