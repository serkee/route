<template>
  <div class="container">
    <div class="header">
      <div class="header__left">
        <button class="back-button" @click="goBack">←</button>
      </div>
      <h1>게시글 상세</h1>
      <div class="header__right"></div>
    </div>

    <div class="post-detail">
      <h2>{{ post.title }}</h2>
      <div class="post-meta">
        <span class="post-img">
            <img src="@/assets/images/contents/@thumb.png" alt="">
        </span>
        <strong class="post-author">{{ post.author }}</strong>
        <span class="post-date"><strong>{{ post.date }}</strong></span>
        <span class="post-views">조회 <strong>{{ post.views }}</strong></span>
      </div>
      <div class="post-content">
        <p>{{ post.content }}</p>
      </div>
    </div>

    <div class="comments-section">
      <h3>댓글 ({{ comments.length }})</h3>
      <div v-if="comments.length > 0">
        <ul>
          <li
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-author">{{ comment.author }}</div>
            <div class="comment-text">{{ comment.text }}</div>
            <div class="comment-date">{{ comment.date }}</div>
          </li>
        </ul>
      </div>
      <p v-else>댓글이 없습니다.</p>

      <div class="comment-form">
        <textarea
          v-model="newComment"
          placeholder="댓글을 입력하세요"
        ></textarea>
        <button @click="addComment">댓글 작성</button>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router"; // useRoute와 useRouter를 import

const route = useRoute(); // 현재 라우트 정보를 가져오는 useRoute 인스턴스 생성
const router = useRouter(); // 라우터 이동을 위한 useRouter 인스턴스 생성

// 게시글 상세 정보를 저장할 반응형 변수
const post = ref({
  id: null,
  title: "로딩 중...", // 초기 로딩 상태 표시
  content: "내용 로딩 중...",
  author: "",
  date: "",
  views: 0,
});

// 댓글 목록을 저장할 반응형 변수
const comments = ref([]);
// 새로 작성할 댓글 내용을 저장할 반응형 변수
const newComment = ref("");

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1); // 브라우저 히스토리에서 뒤로 한 단계 이동
};

// 게시글 데이터를 불러오는 함수 (Placeholder - 실제 백엔드 연동 필요)
const fetchPostDetail = async (postId) => {
  console.log("게시글 상세 데이터 로드 시도 (ID:", postId, ")");
  // 실제 백엔드 API 호출 로직을 여기에 구현합니다.
  // 예시:
  // try {
  //   const response = await fetch(`/api/posts/${postId}`);
  //   if (!response.ok) {
  //     throw new Error('Failed to fetch post');
  //   }
  //   const data = await response.json();
  //   post.value = data; // 불러온 데이터를 post 변수에 할당
  //   // 댓글 데이터도 함께 불러오는 경우가 많습니다.
  //   // comments.value = data.comments;
  // } catch (error) {
  //   console.error('게시글 로드 오류:', error);
  //   // 오류 발생 시 사용자에게 알리거나 목록 페이지로 리디렉션
  //   alert('게시글을 불러오는데 실패했습니다.');
  //   router.push('/board');
  // }

  // 임시 데이터 (Placeholder) - 실제 백엔드 연동 시 이 부분은 제거
  await new Promise((resolve) => setTimeout(resolve, 500)); // 데이터 로딩 시뮬레이션

  post.value = {
    id: postId,
    title: `예시 게시글 제목 ${postId}`,
    content: `이것은 ID가 ${postId}인 게시글의 내용입니다. 여기에 상세 내용이 표시됩니다.\n\n줄바꿈도 테스트 해봅니다.`,
    author: "작성자" + postId,
    date: "2023-10-27",
    views: 123 + parseInt(postId, 10), // 조회수 임시 계산
  };

  // 임시 댓글 데이터 (Placeholder) - 실제 백엔드 연동 시 이 부분은 제거
  comments.value = [
    {
      id: 1,
      author: "댓글러1",
      text: "첫 번째 댓글입니다!",
      date: "2023-10-27",
    },
    {
      id: 2,
      author: "댓글러2",
      text: "좋은 정보 감사합니다.",
      date: "2023-10-28",
    },
  ];
};

// 댓글 작성 함수 (Placeholder - 실제 백엔드 연동 필요)
const addComment = () => {
  if (newComment.value.trim() === "") {
    alert("댓글 내용을 입력해주세요.");
    return;
  }
  // 여기에 댓글 데이터를 백엔드 API로 전송하는 로직을 구현합니다.
  console.log("댓글 작성 시도:", newComment.value, "게시글 ID:", post.value.id);

  // 임시 댓글 추가 (Placeholder) - 실제 백엔드 연동 시 이 부분은 제거
  const tempComment = {
    id: comments.value.length + 1, // 임시 ID
    author: "현재 사용자", // 실제 로그인한 사용자 이름으로 교체
    text: newComment.value.trim(),
    date: new Date().toISOString().split("T")[0], // 현재 날짜 (YYYY-MM-DD 형식)
  };
  comments.value.push(tempComment);
  newComment.value = ""; // 입력 필드 초기화

  alert("댓글이 작성되었습니다.");
};

// 컴포넌트가 마운트될 때 실행
onMounted(() => {
  // 라우트 파라미터에서 게시글 ID 가져오기
  const postId = route.params.id;
  console.log("BoardDetailView mounted. 라우트 파라미터 ID:", postId);

  if (postId) {
    fetchPostDetail(postId); // 게시글 데이터 로드 함수 호출
  } else {
    console.error("게시글 ID가 라우트 파라미터에 없습니다.");
    // ID가 없을 경우 오류 처리 (예: 목록 페이지로 리디렉션 또는 오류 메시지 표시)
    alert("잘못된 접근입니다.");
    router.push("/board"); // 게시판 목록 페이지로 이동
  }
});
</script>
  
  <style scoped>
.post-detail {
  flex-grow: 1; /* 상세 내용이 남은 공간을 차지하도록 */
  width: 100%;
  text-align: left;
  border-bottom: 1px solid #eee;
  background-color: white; /* 배경색 */
}

.post-detail h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 22px;
  color: #333;
  word-break: break-word; /* 긴 제목 줄바꿈 */
  padding: 0 20px;
}



.post-meta {
  font-size: 14px;
  color: #777;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding: 0 20px 20px 70px;
  position: relative;
  height: 54px;
}

.post-img{
    width: 40px;
    height: 40px;
    background: #e9e9e9;
    border-radius: 100%;
    overflow: hidden;
    display: block;
    position: absolute;
    left: 20px;
    top: -3px;
}
.post-img:before{
    content: '';
    display:block;
    position: relative;
    width: 100%;
    height: 100%;
    background: url(@/assets/images/common/ico_menu_user.svg) no-repeat center bottom;
    background-size: 70% auto;
    opacity: .15;
}
.post-author{font-weight: 500; color: #000; display: block; margin-bottom: 5px; font-size: 14px;}


.post-meta span {
  font-size: 13px;
  color: #999;
}
.post-meta span strong{
    color: #222;
}
.post-meta span + span{margin-left: 10px;}

.post-content {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  word-break: break-word; /* 내용 줄바꿈 */
  white-space: pre-wrap; /* 개행 문자 유지 */
  padding: 20px;
}

.comments-section {
  width: 100%;
  background-color: white; /* 배경색 */
  margin-top: 50px;
  text-align: left;
}

.comments-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding: 0 20px 10px;
  color: #333;
}

.comments-section ul {
  list-style: none;
  padding: 0 20px;
}

.comment-item {
  border-bottom: 1px dotted #ccc;
  padding: 10px 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #555;
  position: relative;
}

.comment-author {
  font-weight: bold;
  margin-bottom: 8px;
}

.comment-text {
  word-break: break-word; /* 댓글 내용 줄바꿈 */
}

.comment-date {
  font-size: 12px;
  color: #999;
  text-align: right; /* 날짜 오른쪽 정렬 */
  position: absolute;
  right: 0;
  top: 12px;
}

.comment-form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #eee; /* 댓글 폼 구분선 */
  padding: 15px 20px 0;
}

.comment-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #eaeced;
  background: #f5f6f8;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  border-radius: 4px;
}

.comment-form button {
  align-self: flex-end; /* 버튼을 오른쪽으로 정렬 */
  padding: 8px 15px;
  font-size: 14px;
  color: white;
  background-color: #007bff; /* 파란색 배경 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comment-form button:hover {
  background-color: #0056b3;
}
.container{padding-left: 0; padding-right: 0;}

</style>