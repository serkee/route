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
          <!-- <img src="@/assets/images/contents/@thumb.png" alt="" /> -->
        </span>
        <strong class="post-author">{{ post.author }}</strong>
        <span class="post-date"
          ><strong>{{ post.date }}</strong></span
        >
        <span class="post-views"
          >조회 <strong>{{ post.views }}</strong></span
        >
      </div>
      <div class="post-content">
        <div v-html="post.content"></div>
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
            <div class="comment-date">
              {{ comment.date }}
              <button class="btn-reply" @click="toggleReplyForm(comment.id)">
                답글쓰기
              </button>
            </div>

            <ul
              v-if="comment.replies && comment.replies.length > 0"
              class="replies-list"
            >
              <li
                v-for="reply in comment.replies"
                :key="reply.id"
                class="comment-item reply-item"
              >
                <div class="comment-author">{{ reply.author }}</div>
                <div class="comment-text">{{ reply.text }}</div>
                <div class="comment-date">{{ reply.date }}</div>
              </li>
            </ul>

            <div
              v-if="replyingToCommentId === comment.id"
              class="comment-form reply-form"
            >
              <textarea
                v-model="newReplyText"
                placeholder="답글을 입력하세요"
              ></textarea>
              <button @click="addReply(comment.id)">답글 작성</button>
            </div>
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
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const post = ref({
  id: null,
  title: "로딩 중...",
  content: "내용 로딩 중...", // v-html 사용 시 여기에 HTML 포함 가능
  author: "",
  date: "",
  views: 0,
});

// 댓글 목록 (각 댓글 객체에 replies 배열 추가)
const comments = ref([]);

// 원글에 대한 새 댓글 내용
const newComment = ref("");

// **대댓글 관련 상태 변수**
// 현재 답글을 작성 중인 댓글의 ID
const replyingToCommentId = ref(null);
// 작성 중인 대댓글 내용
const newReplyText = ref("");

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1);
};

// 게시글 데이터를 불러오는 함수 (Placeholder)
const fetchPostDetail = async (postId) => {
  console.log("게시글 상세 데이터 로드 시도 (ID:", postId, ")");

  await new Promise((resolve) => setTimeout(resolve, 500));

  // 임시 데이터 (v-html 사용 예시 및 경로 수정)
  post.value = {
    id: postId,
    title: `예시 게시글 제목 ${postId}`,
    // v-html 사용 예시: 이미지 태그 및 줄바꿈(<br>) 포함
    // 정적 파일 경로는 프로젝트 설정에 맞게 조정해야 할 수 있습니다.
    content: `<div class="img"><img src="/images/contents/@thumb.png" alt=""></div>이것은 ID가 ${postId}인 게시글의 내용입니다. 여기에 상세 내용이 표시됩니다.\n\n줄바꿈도 테스트 해봅니다.`,
    author: "작성자" + postId,
    date: "2023-10-27",
    views: 123 + parseInt(postId, 10),
  };

  // 임시 댓글 데이터 (각 댓글에 replies 배열 추가)
  comments.value = [
    {
      id: 1,
      author: "댓글러1",
      text: "첫 번째 댓글입니다!",
      date: "2023-10-27",
      replies: [
        // 이 댓글에 대한 대댓글 목록
        {
          id: 101,
          author: "대댓글러A",
          text: "첫 번째 댓글에 대한 대댓글입니다.",
          date: "2023-10-27",
          parentId: 1,
        },
      ],
    },
    {
      id: 2,
      author: "댓글러2",
      text: "좋은 정보 감사합니다.",
      date: "2023-10-28",
      replies: [], // 이 댓글은 아직 대댓글이 없습니다.
    },
    {
      id: 3,
      author: "댓글러3",
      text: "세 번째 댓글입니다.",
      date: "2023-10-28",
      replies: [
        {
          id: 102,
          author: "대댓글러B",
          text: "세 번째 댓글에 답글 달아요.",
          date: "2023-10-28",
          parentId: 3,
        },
        {
          id: 103,
          author: "대댓글러C",
          text: "저도요!",
          date: "2023-10-28",
          parentId: 3,
        },
      ],
    },
  ];
};

// 원글에 대한 댓글 작성 함수 (Placeholder)
const addComment = () => {
  if (newComment.value.trim() === "") {
    alert("댓글 내용을 입력해주세요.");
    return;
  }
  console.log("댓글 작성 시도:", newComment.value, "게시글 ID:", post.value.id);

  const tempComment = {
    // 실제 백엔드에서는 서버에서 고유 ID를 생성해야 합니다.
    id: Date.now(), // 임시 ID (실제 서비스에서는 중복 위험 있음)
    author: "현재 사용자",
    text: newComment.value.trim(),
    date: new Date().toISOString().split("T")[0],
    replies: [], // 새 댓글에는 초기에는 대댓글이 없습니다.
  };
  comments.value.push(tempComment);
  newComment.value = "";

  alert("댓글이 작성되었습니다.");
  // 실제 백엔드 연동 시에는 여기서 API 호출 후 성공 시 comments 목록을 새로고침하거나 추가합니다.
};

// **대댓글 관련 함수**

// 답글 폼 표시/숨김 토글
const toggleReplyForm = (commentId) => {
  if (replyingToCommentId.value === commentId) {
    // 이미 해당 댓글의 폼이 열려 있으면 닫기
    replyingToCommentId.value = null;
    newReplyText.value = ""; // 폼 닫을 때 내용 초기화
  } else {
    // 다른 댓글 폼이 열려 있으면 닫고, 현재 댓글 폼 열기
    replyingToCommentId.value = commentId;
    newReplyText.value = ""; // 새 폼 열 때 내용 초기화
  }
};

// 대댓글 작성 함수 (Placeholder)
const addReply = (parentCommentId) => {
  if (newReplyText.value.trim() === "") {
    alert("답글 내용을 입력해주세요.");
    return;
  }

  // 부모 댓글 찾기
  const parentComment = comments.value.find((c) => c.id === parentCommentId);

  if (!parentComment) {
    console.error("부모 댓글을 찾을 수 없습니다.");
    return;
  }

  console.log(
    `대댓글 작성 시도 (부모 댓글 ID: ${parentCommentId}):`,
    newReplyText.value
  );

  const tempReply = {
    // 실제 백엔드에서는 서버에서 고유 ID를 생성해야 합니다.
    id: Date.now() + Math.random(), // 임시 ID (실제 서비스에서는 중복 위험 있음)
    author: "현재 사용자", // 실제 로그인한 사용자 이름으로 교체
    text: newReplyText.value.trim(),
    date: new Date().toISOString().split("T")[0],
    parentId: parentCommentId, // 부모 댓글 ID 저장 (선택 사항이지만 유용)
  };

  // 해당 부모 댓글의 replies 배열에 대댓글 추가
  parentComment.replies.push(tempReply);

  // 입력 필드 초기화 및 폼 닫기
  newReplyText.value = "";
  replyingToCommentId.value = null;

  alert("답글이 작성되었습니다.");
  // 실제 백엔드 연동 시에는 여기서 API 호출 후 성공 시 해당 댓글의 대댓글 목록을 새로고침하거나 추가합니다.
};

// 컴포넌트가 마운트될 때 실행
onMounted(() => {
  const postId = route.params.id;
  console.log("BoardDetailView mounted. 라우트 파라미터 ID:", postId);

  if (postId) {
    fetchPostDetail(postId);
  } else {
    console.error("게시글 ID가 라우트 파라미터에 없습니다.");
    alert("잘못된 접근입니다.");
    router.push("/board");
  }
});
</script>

<style scoped>
/* 기존 스타일 유지 */

/* post-detail과 comments-section이 flex-grow를 가질 수 있도록 부모 컨테이너의 높이를 설정 */
.post-detail {
  flex-shrink: 0; /* 게시글 상세 내용은 스크롤되지 않도록 */
  width: 100%;
  text-align: left;
  border-bottom: 1px solid #eee;
  background-color: white;
  padding-bottom: 20px; /* 하단 여백 추가 */
  box-sizing: border-box;
}

.post-detail h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 22px;
  color: #333;
  word-break: break-word;
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

.post-img {
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
.post-img:before {
  content: "";
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  background: url(@/assets/images/common/ico_menu_user.svg) no-repeat center
    bottom;
  background-size: 70% auto;
  opacity: 0.15;
}
.post-author {
  font-weight: 500;
  color: #000;
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.post-meta span {
  font-size: 13px;
  color: #999;
}
.post-meta span strong {
  color: #222;
}
.post-meta span + span {
  margin-left: 10px;
}

.post-content {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  word-break: break-word;
  /* white-space: pre-wrap; */ /* v-html 사용 시 필요에 따라 조정 */
  padding: 0 20px; /* 좌우 패딩 조정 */
}

/* post.content 내 이미지 스타일 */


.comments-section {
  width: 100%;
  background-color: white;
  margin-top: 20px; /* 게시글 상세와 댓글 섹션 사이 간격 조정 */
  text-align: left;
  flex-grow: 1; /* 댓글 섹션이 남은 공간을 차지하고 스크롤 */
  box-sizing: border-box;
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
  border:0;
}

.comment-item {
  border-bottom: 1px dotted #e0e0e0;
  padding: 10px 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #555;
  position: relative;
}

.comment-author {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}

.comment-text {
  word-break: break-word;
  margin-bottom: 5px; /* 날짜와의 간격 */
}

.comment-date {
  font-size: 12px;
  color: #999;
  margin-top: 7px;
}

.btn-reply {
  font-size: 12px;
  padding: 3px;
  border: 1px solid #e1e1e1;
  background: #fff;
  color: #666;
  border-radius: 5px;
  margin-left: 10px;
  cursor: pointer;
}

/* 대댓글 목록 스타일 */
.replies-list {
  list-style: none;
  padding: 0;
  margin-top: 10px;
  border-top: 1px solid #eee; /* 대댓글 목록 상단 구분선 */
  padding-top: 10px;
  /* margin-left: 20px; */
}

.reply-item {
  background-color: #f9f9f9; /* 대댓글 배경색 */
  border: 1px solid #eee; /* 대댓글 테두리 */
  padding: 10px;
  margin-bottom: 0;
  border-radius: 4px;
}
.reply-item + .reply-item{
  margin-top: 10px;
}

.reply-item .comment-author {
}
.reply-item .comment-text {
}
.reply-item .comment-date {
  font-size: 11px; /* 대댓글 날짜 폰트 크기 조정 */
}

/* 댓글 및 대댓글 작성 폼 공통 스타일 */
.comment-form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #eee;
  padding: 15px 20px; /* 하단 패딩 추가 */
}

/* 대댓글 작성 폼 특정 스타일 */
.reply-form {
  margin-top: 10px; /* 댓글 본문과의 간격 */
  padding: 10px 20px; /* 패딩 조정 */
  background-color: #f9f9f9; /* 배경색 */
  border: 1px solid #eee; /* 테두리 */
  border-radius: 4px;
  margin-bottom: 10px; /* 댓글 아이템 하단 간격 */
}

.comment-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #eaeced;
  background: #f5f6f8;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px; /* 대댓글 폼 높이 조정 */
  box-sizing: border-box;
}

.comment-form button {
  align-self: flex-end;
  padding: 8px 15px;
  font-size: 14px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comment-form button:hover {
  background-color: #0056b3;
}

/* 전체 컨테이너 패딩 제거는 그대로 */
.container {
  padding-left: 0;
  padding-right: 0;
}
</style>

<style>
.post-content .img{
  text-align: center;
}
.post-content .img img {
  max-width: 100%; /* 이미지가 부모 너비를 넘지 않도록 */
  height: auto;
  display: block; /* 이미지 하단 미세 공간 제거 */
  margin: 0 auto 15px auto; /* 중앙 정렬 및 하단 간격 */
}
</style>