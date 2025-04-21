<template>
  <div class="container">
    <AppHeader />
    <div class="content">
      <div class="tab">
        <ul>
          <li :class="{ active: activeTab === 0 }">
            <button @click="changeTab(0)">자유게시판</button>
          </li>
          <li :class="{ active: activeTab === 1 }">
            <button @click="changeTab(1)">루트</button
            ><span class="new">N</span>
          </li>
          <li :class="{ active: activeTab === 2 }">
            <button @click="changeTab(2)">중고마켓</button>
          </li>
        </ul>
      </div>
      <div class="list">
        <ul>
          <li class="notice">
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(1)">
              <div class="txt">
                <p>
                  피아노 안다닌 친구들 후기 궁금합니다 피아노 안다닌 친구들 후기
                  궁금합니다
                </p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="" />
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(2)">
              <div class="txt">
                <p>
                  피아노 안다닌 친구들 후기 궁금합니다 피아노 안다닌 친구들 후기
                  궁금합니다
                </p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(3)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="" />
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(4)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="" />
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(5)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="" />
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(6)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="" />
              </div>
            </a>
          </li>
        </ul>
      </div>
      <button class="btn-feed" @click="goToWritePage">+ 피드쓰기</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"; // useRouter import
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import (경로 확인)

// 현재 활성화된 탭의 인덱스를 저장하는 반응형 변수
const activeTab = ref(0); // 초기값으로 첫 번째 탭(인덱스 0)을 활성화합니다.

const router = useRouter(); // useRouter 인스턴스 생성

// 탭 변경 함수
const changeTab = (index) => {
  activeTab.value = index; // 클릭된 탭의 인덱스로 activeTab 값을 업데이트합니다.
  // 실제 애플리케이션에서는 여기에 선택된 탭에 해당하는 데이터를 불러오는 로직을 구현합니다.
  console.log("탭이 변경되었습니다. 인덱스:", index);
};

// "피드쓰기" 버튼 클릭 시 쓰기 페이지로 이동하는 함수
const goToWritePage = () => {
  router.push("/board/write"); // 쓰기 페이지 라우트 경로로 이동
};

// 게시글 상세 페이지로 이동하는 함수
const goToPostDetail = (postId) => {
  console.log("게시글 클릭. 상세 페이지로 이동 (ID:", postId, ")");
  // '/board/:id' 형태의 라우트로 이동하며, :id 부분에 postId 값을 넣습니다.
  router.push(`/board/${postId}`);
  // 또는 router.push({ name: 'board-detail', params: { id: postId } });
};
</script>

<style scoped>
/* 기존 스타일 유지 */
.container {
  width: 100%;
  max-width: 500px; /* Example max-width */
  margin: 0 auto;
  padding: 0 20px; /* Add padding */
  box-sizing: border-box;
}

.content {
  width: 100%;
  position: relative;
  padding-top: 120px; /* 헤더 + 탭 높이에 맞춰 조정 */
}
.tab {
  position: fixed;
  left: 0;
  right: 0px;
  top: var(
    --header-height,
    50px
  ); /* 실제 헤더 높이에 맞춰 top 조정. 필요하다면 CSS 변수 --header-height 값을 정의하세요. */
  z-index: 2;
  padding: 0 20px;
  background: #fff;
}
.tab > ul {
  display: flex;
  padding: 20px 0 10px;
  gap: 10px;
}
.tab > ul > li {
  flex: 1;
  position: relative;
}
.tab > ul > li .new {
  position: absolute;
  right: -3px;
  top: -3px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  background: rgb(216, 0, 0);
  color: #fff;
  display: block;
  border-radius: 100%;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}
.tab > ul > li > button {
  height: 40px;
  line-height: 41px;
  font-size: 18px;
  border: 0;
  border: 1px solid rgb(223, 223, 223);
  background: transparent;
  width: 100%;
  padding: 0;
  cursor: pointer;
  border-radius: 20px;
  cursor: pointer;
}
.tab > ul > li.active > button {
  font-weight: bold;
  color: rgb(21, 115, 238);
  background: rgb(225, 241, 255);
}
.list {
  margin: 0 -20px;
}
.list > ul {
}
.list > ul > li {
  position: relative;
  border-bottom: 1px solid #f3f3f3;
  padding: 0 20px;
}
.list > ul > li > a {
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  gap: 10px;
  text-decoration: none;
  color: #222;
  min-height: 100px;
}
.list > ul > li > a .txt {
  flex: 1;
  overflow: hidden;
}
.list > ul > li > a .txt > p {
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.list > ul > li > a .txt > ul {
  display: flex;
  margin-top: 15px;
  gap: 30px;
  padding: 0;
}
.list > ul > li > a .txt > ul > li {
  font-size: 13px;
  color: #999;
}
.list > ul > li > a .txt > ul > li > span {
  color: #222;
}
.list > ul > li > a .txt > ul > li .rep {
  display: inline-block;
  vertical-align: middle;
  width: 15px;
  height: 15px;
  margin: -3px 0 0 0;
  background-color: #c7c7c7;
  -webkit-mask-image: url(@/assets/images/common/ico_comment.svg);
  mask-image: url(@/assets/images/common/ico_comment.svg);
  -webkit-mask-size: cover;
}
.list > ul > li > a .img {
  overflow: hidden;
  border-radius: 5px;
  font-size: 0;
  width: 80px;
  height: 80px;
  position: relative;
  flex-shrink: 0;
}
.list > ul > li > a img {
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.list > ul > li.notice {
  background: #eff7ff;
}
.list > ul > li.notice > a .txt > p:before {
  content: "공지";
  color: #005fec;
  display: inline-block;
  margin-right: 5px;
}
.btn-feed {
  position: fixed;
  bottom: 75px; /* 하단 네비게이션 바 높이에 맞춰 조정 */
  right: 15px;
  height: 50px;
  background: rgb(19, 177, 56);
  border: 0;
  font-size: 20px;
  color: #fff;
  padding: 0 20px;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
}
</style>