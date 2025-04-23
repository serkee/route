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
      <h2>{{ post.title }}</h2>
      <p>카테고리: {{ post.category }}</p>
      <p>작성자 ID: {{ post.authorId }}</p>
      <p>작성일: {{ formatDate(post.createdAt) }}</p>
      <p>조회수: {{ post.views }}</p>
      <div class="content-body">
        {{ post.content }}
      </div>

      <div class="comments-section">
        <h3>댓글 ({{ post.commentCount || 0 }})</h3>
        <div v-for="comment in comments" :key="comment.id"> ... </div>

        <div v-if="currentUser" class="add-comment-form">
            <textarea v-model="newCommentText" placeholder="댓글을 입력하세요"></textarea>
            <button @click="addComment">댓글 작성</button>
        </div>
        <div v-else class="login-prompt">
            댓글을 작성하려면 로그인하세요.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // useRoute, useRouter import
import { getAuth } from 'firebase/auth'; // 현재 로그인 사용자 정보 가져오기 위해 import

// boardService.js 파일에서 필요한 함수들을 import 합니다.
// *** getPostDetail 대신 getPostById를 import 합니다. ***
import {
  getPostById,      // 게시글 상세 정보 가져오기 함수 (이름 수정)
  addCommentToPost, // 댓글 추가 함수 (사용한다면 import)
  deletePost        // 게시글 삭제 함수 (사용한다면 import)
  // getPosts 등 이 페이지에서 사용하지 않는 함수는 import 하지 않습니다.
} from '@/services/boardService'; // boardService 파일의 실제 경로에 맞게 수정


const route = useRoute(); // 현재 라우트 정보 가져오기
const router = useRouter(); // 라우터 인스턴스 가져오기
const postId = route.params.id; // 라우트 파라미터에서 게시글 ID 가져오기

const post = ref(null); // 게시글 데이터를 저장할 반응형 변수
const loading = ref(true); // 로딩 상태를 나타낼 반응형 변수
const currentUser = ref(null); // 현재 로그인 사용자 정보를 저장할 반응형 변수

const newCommentText = ref(''); // 새로운 댓글 내용을 저장할 반응형 변수
// const comments = ref([]); // 댓글 목록을 저장할 반응형 변수 (댓글 기능 구현 시)


// 게시글 데이터 가져오는 함수
const fetchPost = async () => {
  loading.value = true;
  try {
    // *** getPostDetail 대신 getPostById 함수 호출 ***
    const fetchedPost = await getPostById(postId);
    post.value = fetchedPost;
  } catch (error) {
    console.error("게시글 가져오기 오류:", error);
    // 오류 처리 로직 (예: 에러 메시지 표시)
  } finally {
    loading.value = false;
  }
};

// 댓글 추가 함수 (addCommentToPost 함수 사용)
const addComment = async () => {
    if (!newCommentText.value.trim()) {
        alert('댓글 내용을 입력하세요.');
        return;
    }
    if (!currentUser.value) {
        alert('댓글을 작성하려면 로그인해야 합니다.');
        // 로그인 페이지로 리디렉션 또는 다른 처리
        return;
    }

    try {
        const commentData = {
            text: newCommentText.value.trim(),
            // authorId: currentUser.value.uid, // boardService에서 추가하거나 여기서 포함
            // authorName: currentUser.value.displayName || '익명', // 여기서 포함
            // ... 필요한 다른 필드 ...
        };

        // *** boardService의 addCommentToPost 함수 호출 ***
        await addCommentToPost(postId, commentData);

        newCommentText.value = ''; // 입력 필드 초기화
        // 댓글 목록을 다시 로드하거나 새로 추가된 댓글을 목록에 반영하는 로직
        // 예: await fetchComments(postId);

        alert('댓글이 작성되었습니다.');

    } catch (error) {
        console.error("댓글 작성 오류:", error);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
};


// 게시글 삭제 함수 (deletePost 함수 사용)
const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        return;
    }
     if (!post.value || !currentUser.value || currentUser.value.uid !== post.value.authorId) {
        alert('게시글 작성자만 삭제할 수 있습니다.');
        return;
    }

    try {
        // *** boardService의 deletePost 함수 호출 ***
        await deletePost(postId);
        alert('게시글이 삭제되었습니다.');
        router.push('/board'); // 게시글 목록 페이지로 이동

    } catch (error) {
        console.error("게시글 삭제 오류:", error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
    }
};


// 날짜 포맷팅 함수 (예시, 실제 구현 필요)
const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';
    // Firebase Timestamp 객체를 JavaScript Date 객체로 변환하여 포맷팅
    const date = timestamp.toDate(); // toDate() 메소드 사용
    return date.toLocaleString(); // 또는 원하는 형식으로 포맷팅
};


// 뒤로 가기 함수
const goBack = () => {
  router.go(-1);
};


// 컴포넌트가 마운트될 때 게시글 데이터를 가져옵니다.
onMounted(async () => {
  const auth = getAuth(); // Auth 인스턴스 가져오기
  currentUser.value = auth.currentUser; // 현재 로그인 사용자 정보 저장

  if (postId) {
    await fetchPost(); // 게시글 ID가 있으면 데이터 가져오기
    // 필요하다면 댓글 목록도 가져오는 함수 호출 (예: await fetchComments(postId);)
  } else {
    // 게시글 ID가 없을 경우 처리 (예: 목록 페이지로 리디렉션)
    console.error("게시글 ID가 없습니다.");
    router.replace('/board'); // 목록 페이지로 이동
  }
});

</script>

<style scoped>

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

.post-content h2 {
    margin-top: 0;
    font-size: 22px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.post-content p {
    font-size: 14px;
    color: #555;
    margin-bottom: 5px;
}

.content-body {
    margin-top: 20px;
    font-size: 16px;
    line-height: 1.6;
    white-space: pre-wrap; /* 줄바꿈 및 공백 유지 */
    word-break: break-word; /* 긴 단어 자동 줄바꿈 */
}

/* 댓글 섹션 스타일 */
.comments-section {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 20px;
}

.comments-section h3 {
    font-size: 20px;
    margin-bottom: 15px;
}

.add-comment-form {
    margin-top: 15px;
    display: flex;
    gap: 10px; /* 입력 필드와 버튼 사이 간격 */
}

.add-comment-form textarea {
    flex-grow: 1; /* 입력 필드가 남은 공간 차지 */
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    min-height: 90px;
    box-sizing: border-box;
}

.add-comment-form button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    align-self: flex-start; /* 버튼을 상단에 정렬 */
    height: 90px;
}

.login-prompt {
    margin-top: 15px;
    font-style: italic;
    color: #777;
}

/* 로딩 및 찾을 수 없음 메시지 스타일 */
.loading, .not-found {
    text-align: center;
    font-size: 18px;
    color: #777;
    margin-top: 50px;
}
</style>