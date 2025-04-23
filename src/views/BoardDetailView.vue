<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>게시글 상세</h1>
       <button v-if="post && currentUser && currentUser.uid === post.authorId" @click="handleDelete" class="delete-button">삭제</button>
       <div v-else class="header__right"></div>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="!post" class="not-found">게시글을 찾을 수 없습니다.</div>

    <div v-else class="post-content">

      <div class="post-content-head">
        <a href="javascript:void(0)" class="post-content-head-cate" @click="goToCategoryList">{{ getCategoryDisplayName(post.category) }} ></a>
        <h2>{{ post.title }}</h2>
        <div class="post-content-info">
          <span class="profile">
            <img src="/images/contents/@thumb.png" alt="">
          </span>
          <p class="name">{{ post.authorId }}</p>
          <p class="info">{{ formatDate(post.createdAt) }} <span>조회수 {{ post.views }}</span></p>
          <p></p>
        </div>
      </div>
      <div class="content-body">
        <div v-if="post.imageUrl" class="img">
          <img :src="post.imageUrl" :alt="post.title + ' 이미지'">
        </div>
        {{ post.content }}
      </div>

      <div class="comments-section">
        <h3>댓글 ({{ comments.length }})</h3>
        <div v-if="comments.length > 0" class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item" :class="{ 'is-reply': comment.parentId }">
              <div class="comment-author">
                {{ comment.authorName || comment.authorId || '익명' }}
              </div>
              <div class="comment-text">
                <span v-if="comment.parentId" class="reply-indicator">→</span>{{ comment.text }}
              </div>
              <div class="comment-info">
                {{ formatDate(comment.createdAt) }}
                <button v-if="!comment.parentId && currentUser" @click="startReply(comment.id)" class="reply-button">답글</button>
              </div>

              <div v-if="replyingToCommentId === comment.id && currentUser" class="add-comment-form nested">
                <textarea v-model="newCommentText" :placeholder="`${(comment.authorName || comment.authorId || '댓글') }에게 답글 작성`"></textarea>
                <div class="form-actions">
                  <button @click="addComment">답글 작성</button>
                  <button @click="cancelReply" class="cancel-button">취소</button>
                </div>
              </div>

               <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                   <div v-for="reply in comment.replies" :key="reply.id" class="comment-item is-reply">
                      <div class="comment-author">
                          {{ reply.authorName || reply.authorId || '익명' }}
                      </div>
                      <div class="comment-text">
                          <span class="reply-indicator">→</span>
                          {{ reply.text }}
                      </div>
                      <div class="comment-info">
                           {{ formatDate(reply.createdAt) }}
                      </div>
                   </div>
               </div>
            </div>
        </div>
        <div v-else class="no-comments-message">
            <p>아직 댓글이 없습니다.</p>
        </div>

        <div v-if="currentUser && !replyingToCommentId" class="add-comment-form">
            <textarea v-model="newCommentText" placeholder="댓글을 입력하세요"></textarea>
            <button @click="addComment">댓글 작성</button>
        </div>
        <div v-else-if="!currentUser && !replyingToCommentId" class="login-prompt">
            댓글을 작성하려면 로그인하세요.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAuth } from 'firebase/auth';

import {
  getPostById,
  addCommentToPost,
  deletePost
} from '@/services/boardService';

// Firestore SDK 함수 import
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
// @/firebase 에서 db 인스턴스 import
import { db } from '@/firebase';


const route = useRoute();
const router = useRouter();
const postId = route.params.id;

const post = ref(null);
const loading = ref(true);
const currentUser = ref(null);

const newCommentText = ref('');
const comments = ref([]); // 최상위 댓글과 그 안에 답글 배열을 포함하는 구조로 관리

// 댓글 실시간 리스너 해제 함수
let unsubscribeComments = null;

// 현재 답글 작성 중인 댓글의 ID를 저장 (최상위 댓글 ID)
const replyingToCommentId = ref(null); // null이면 최상위 댓글 작성 모드


// Firestore에 저장된 category 값과 화면 표시용 한글 이름을 매핑하는 객체
const categoryDisplayNameMap = {
  'free': '자유게시판',
  'route': '루트',
  'market': '중고마켓',
};

// category 값을 받아 한글 표시 이름으로 변환하는 함수
const getCategoryDisplayName = (categoryValue) => {
  return categoryDisplayNameMap[categoryValue] || categoryValue;
};

// *** 추가: 카테고리 목록 페이지로 이동하는 함수 ***
const goToCategoryList = () => {
  // post 데이터가 로드되었고 category 값이 있을 때만 실행
  if (post.value && post.value.category) {
    // /board 라우트로 이동하면서 post.category 값을 'category' 쿼리 파라미터로 전달
    router.push({ path: '/board', query: { category: post.value.category } });
  } else {
    // 만약 post 데이터나 category가 없다면 기본 게시판 목록으로 이동
    router.push('/board');
  }
};

// 게시글 데이터 가져오는 함수
const fetchPost = async () => {
  loading.value = true;
  try {
    const fetchedPost = await getPostById(postId);
    post.value = fetchedPost;

    // *** 게시글 조회수 증가 로직 추가 ***
    // 게시글 정보를 성공적으로 가져온 후 조회수를 증가시킵니다.
    if (post.value) {
        const postRef = doc(db, 'posts', postId); // 해당 게시글 문서 참조 가져오기
        try {
            // updateDoc과 increment 함수를 사용하여 views 필드를 원자적으로 1 증가
            await updateDoc(postRef, {
                views: increment(1)
            });
            console.log(`게시글 ${postId} 조회수 1 증가 완료.`);
            // views 필드가 실시간으로 업데이트되므로 화면에도 곧 반영됩니다.
            // post.value.views 값을 클라이언트 측에서 즉시 업데이트할 수도 있습니다.
            if(post.value.views !== undefined) {
                 post.value.views++; // 화면 표시 값을 즉시 증가 (선택 사항)
            } else {
                 post.value.views = 1; // views 필드가 없었다면 1로 초기화 (선택 사항)
            }

        } catch (updateError) {
            console.error("조회수 업데이트 오류:", updateError);
            // 조회수 업데이트 오류는 사용자에게 치명적이지 않으므로 alert는 보통 하지 않습니다.
        }
    }

  } catch (error) {
    console.error("게시글 가져오기 오류:", error);
    // 오류 처리 로직
  } finally {
    loading.value = false;
  }
};

// 특정 게시글의 댓글 목록을 실시간으로 가져오는 함수 (답글 관계 처리)
const listenForComments = (postId) => {
  console.log(`게시글 ${postId} 댓글 리스닝 시작`);
  const commentsCollectionRef = collection(db, 'posts', postId, 'comments');

  // 쿼리: createdAt 기준 오름차순 정렬
  // 답글도 동일한 컬렉션에 저장되고 createdAt으로 정렬하여 가져온 후,
  // 클라이언트 측에서 parentId를 보고 관계를 구성합니다.
  const q = query(commentsCollectionRef, orderBy('createdAt', 'asc'));

  unsubscribeComments = onSnapshot(q, (snapshot) => {
    const allComments = []; // 모든 댓글 (최상위 + 답글) 임시 저장
    snapshot.forEach((doc) => {
      allComments.push({ id: doc.id, ...doc.data(), replies: [] }); // replies 배열 추가
    });

    const commentMap = {}; // 댓글 ID를 키로 댓글 객체를 저장하는 맵
    allComments.forEach(comment => {
        commentMap[comment.id] = comment;
    });

    const topLevelComments = []; // 최상위 댓글만 저장할 배열

    allComments.forEach(comment => {
        if (comment.parentId) {
            // parentId가 있는 댓글 (답글)
            const parent = commentMap[comment.parentId];
            if (parent) {
                // 부모 댓글을 찾으면 부모의 replies 배열에 추가
                parent.replies.push(comment);
            } else {
                // 부모 댓글을 찾을 수 없는 답글 (예: 부모 댓글이 삭제된 경우)
                console.warn(`부모 댓글 ${comment.parentId}를 찾을 수 없습니다. 답글 ID: ${comment.id}`);
                // 필요하다면 고아 답글 처리 로직 추가 (예: 최상위로 표시 등)
                 topLevelComments.push(comment); // 일단 최상위로 표시
            }
        } else {
            // parentId가 없는 댓글 (최상위 댓글)
            topLevelComments.push(comment);
        }
    });

    // 최종적으로 최상위 댓글 배열을 comments 반응형 변수에 할당
    // 답글들은 해당 최상위 댓글 객체의 replies 배열 안에 포함됩니다.
    comments.value = topLevelComments;

    console.log(`게시글 ${postId} 댓글 데이터 업데이트 완료. 최상위 댓글 ${topLevelComments.length}개`);

  }, (error) => {
    console.error("댓글 리스닝 오류:", error);
  });
};


// 댓글 추가 함수 (addCommentToPost 함수 사용 - 답글 기능 포함)
const addComment = async () => {
    if (!newCommentText.value.trim()) {
        alert('댓글 내용을 입력하세요.');
        return;
    }
    if (!currentUser.value) {
        alert('댓글을 작성하려면 로그인해야 합니다.');
        return;
    }

    try {
        const commentData = {
            text: newCommentText.value.trim(),
            // authorId, authorName, createdAt 등은 boardService의 addCommentToPost에서 추가하는 것이 일관적
            // 필요하다면 여기서 authorName 등을 함께 보낼 수도 있습니다.
        };

        // 답글 작성 모드이면 parentId를 commentData에 추가
        if (replyingToCommentId.value) {
            commentData.parentId = replyingToCommentId.value; // <-- 부모 댓글 ID 추가
        }

        // boardService의 addCommentToPost 함수 호출
        // 이 함수는 commentData 객체와 함께 postId를 받아서 Firestore에 저장합니다.
        // boardService에서 이 commentData 객체에 authorId, authorName, createdAt 등을 추가하여 저장해야 합니다.
        await addCommentToPost(postId, commentData);

        newCommentText.value = ''; // 입력 필드 초기화
        replyingToCommentId.value = null; // <-- 답글 모드 해제

        console.log('댓글/답글 작성 요청 완료.');

    } catch (error) {
        console.error("댓글/답글 작성 오류:", error);
        alert('댓글/답글 작성 중 오류가 발생했습니다.');
    }
};

// 답글 작성 모드 시작 (부모 댓글 ID 설정)
const startReply = (commentId) => {
    replyingToCommentId.value = commentId; // 클릭된 댓글의 ID를 답글 작성 모드로 설정
    newCommentText.value = ''; // 입력 필드 초기화
    // 필요하다면 특정 댓글로 스크롤 이동
};

// 답글 작성 모드 취소
const cancelReply = () => {
    replyingToCommentId.value = null; // 답글 모드 해제
    newCommentText.value = ''; // 입력 필드 초기화
};


// 게시글 삭제 함수
const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        return;
    }
     if (!post.value || !currentUser.value || currentUser.value.uid !== post.value.authorId) {
        alert('게시글 작성자만 삭제할 수 있습니다.');
        return;
    }

    try {
        await deletePost(postId);
        alert('게시글이 삭제되었습니다.');
        router.push('/board');

    } catch (error) {
        console.error("게시글 삭제 오류:", error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
    }
};

// 날짜 포맷팅 함수
const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
};

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1);
};

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  const auth = getAuth();
  currentUser.value = auth.currentUser;

  if (postId) {
    await fetchPost(); // 게시글 상세 정보 가져오기
    listenForComments(postId); // 댓글 목록 실시간 리스닝 시작
  } else {
    console.error("게시글 ID가 없습니다.");
    router.replace('/board');
  }
});

// 컴포넌트 언마운트 시 실행
onUnmounted(() => {
  if (unsubscribeComments) {
    unsubscribeComments();
    console.log("댓글 Firestore 리스너 해제됨.");
  }
});

</script>

<style scoped>
/* 기존 스타일 유지 */
/* .container, .header, .back-button, .delete-button 등 */
/* .post-content, .post-content-head, .post-content-head-cate, .post-content-head > h2 */
/* .post-content-info, .post-content-info .profile, .post-content-info .name, .post-content-info .info */
/* .content-body, .content-body .img */
/* .comments-section h3, .comments-section .login-prompt */
/* .add-comment-form textarea, .add-comment-form button */
/* .loading, .not-found */

.container{
  padding-left: 0;
  padding-right: 0;
}
.delete-button {
    background: none;
    border: none;
    cursor: pointer;
    width: 50px;
    font-size: 0;
    background-color: #c7c7c7;
    -webkit-mask-image: url(@/assets/images/common/ico_del.svg);
    mask-image: url(@/assets/images/common/ico_del.svg);
    mask-repeat: no-repeat;
    mask-position: center center;
    -webkit-mask-size: 20px auto;
}

.post-content {
    text-align: left; /* 본문 정렬 */
    width: 100%;
}

.post-content-head {
    padding: 0 20px;
    font-size: 22px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}
.post-content-head-cate{
  display: inline-block;
  margin-bottom: 8px;
  font-size: 14px;
  text-decoration: none;
  color: #005fec;
}
.post-content-head > h2{
  padding-bottom: 18px;
  font-size: 24px;
}

.post-content p {
    font-size: 14px;
    color: #888;
}
.post-content p + p{
  margin-top: 5px;
}

.content-body {
    margin-top: 20px;
    font-size: 16px;
    line-height: 1.6;
    white-space: pre-wrap; /* 줄바꿈 및 공백 유지 */
    word-break: break-word; /* 긴 단어 자동 줄바꿈 */
    padding: 20px;
}
.content-body .img{
  text-align: center;
}
.content-body .img > img{
  max-width: 500px;
  margin-bottom: 20px;
}

/* 댓글 섹션 스타일 */
.comments-section {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding: 20px 20px 0 20px;
}

.comments-section h3 {
    font-size: 18px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}


.comment-list {
    margin-top: 15px;
}

.comment-item {
    border-bottom: 1px solid #eee;
    padding-bottom: 9px;
    margin-bottom: 15px;
}

.comment-author {
    font-weight: bold;
    margin-bottom: 5px;
    color: #333;
    font-size: 14px;
}

.comment-text {
    margin-bottom: 8px;
    line-height: 1.5;
    color: #555;
    white-space: pre-wrap; /* 줄바꿈 및 공백 유지 */
    word-break: break-word; /* 긴 단어 자동 줄바꿈 */
    margin-top: 7px;
}

.comment-info {
    font-size: 12px;
    color: #888;
    text-align: right;
     display: flex; /* 정보를 가로로 배치 */
     gap: 10px;
     align-items: center; /* 세로 중앙 정렬 */
}
/* 답글 달기 버튼 */
.comment-info .reply-button {
    background: none;
    border: 1px solid #ccc;
    padding: 2px 8px;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    color: #555;
}
.comment-info .reply-button:hover {
    background-color: #eee;
}

.no-comments-message{
    text-align: center;
    color: #b9b9b9;
    font-style: italic;
    padding: 20px 0;
    border-bottom: 1px solid #eee;
}

.login-prompt {
    margin-top: 15px;
    font-style: italic;
    color: #777;
}


/* 댓글 입력 폼 (최상위 댓글 폼과 답글 폼 공통) */
.add-comment-form {
    margin-top: 15px;
    display: flex;
    gap: 10px; /* 입력 필드와 버튼 그룹 사이 간격 */
    padding-bottom: 20px; /* 하단 여백 추가 */
    border-bottom: 1px solid #eee; /* 아래 구분선 */
}
.add-comment-form textarea {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    min-height: 60px; /* 최소 높이 조정 */
    box-sizing: border-box;
}
/* 입력 폼 액션 (버튼 그룹) */
.add-comment-form .form-actions {
    display: flex;
    justify-content: flex-end; /* 버튼을 오른쪽으로 정렬 */
    gap: 10px; /* 버튼 사이 간격 */
}
.add-comment-form button {
    padding: 8px 15px; /* 버튼 패딩 조정 */
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px; /* 버튼 글자 크기 조정 */
    color: #fff;
    background: #357ae8;
}
.add-comment-form button:first-child { /* 작성/답글 버튼 */
    background-color: #007bff;
    color: white;
}
.add-comment-form .cancel-button { /* 취소 버튼 */
    background-color: #ddd;
    color: #333;
}


/* 답글 입력 폼 (nested) 스타일 */
.add-comment-form.nested {
    margin-top: 10px;
    padding: 15px;
    background-color: #eef7ff;
    border: 0;
}

/* 답글 목록 (nested) 스타일 */
.replies-list {
    margin-top: 10px;
    padding: 0 0 0 10px;
}

/* 답글 항목 스타일 */
.comment-item.is-reply {
    background-color: #f7f7f7;
    border: 1px solid #eee;
    padding: 12px;
    border-radius: 7px;
    margin-bottom: 0;
}
.comment-item.is-reply + .comment-item.is-reply{
  margin-top:5px
}

/* 답글 표시 화살표 */
.reply-indicator {
    margin-right: 5px;
    font-weight: bold;
    color: #007bff; /* 화살표 색상 */
}


/* 로딩 및 찾을 수 없음 메시지 스타일 */
.loading, .not-found {
    text-align: center;
    font-size: 18px;
    color: #777;
    margin-top: 50px;
}
.post-content-info{position: relative; padding-left: 50px;}
.post-content-info .profile{width: 40px; height: 40px; border-radius: 100%; overflow:hidden; display: block; position: absolute; top: 50%; transform: translateY(-50%); left: 0; background: #ededed;}
.post-content-info .profile:before{content:''; display: block; position: absolute; width: 80%; height: 80%; bottom: 0; left: 50%; transform: translateX(-50%);
background: #cbcbcb;
-webkit-mask-image: url(@/assets/images/common/ico_menu_user.svg);
  mask-image: url(@/assets/images/common/ico_menu_user.svg);
  -webkit-mask-size: cover;}
.post-content-info .profile > img{width: 100%; height: 100%; position: relative; z-index: 2;}
.post-content-info .name{font-size: 15px; font-weight: 500; color: #222;}
</style>