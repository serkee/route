<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>{{ routeDetails.name }}</h1>
      <div class="header__right"></div>
    </div>
    <div class="route-image-section">
      <img
        src="@/assets/images/contents/@map.jpg"
        alt="노적봉 서면 등반 루트"
        class="route-diagram-img"
      />
      <div class="image-actions">
        <button class="view-pitch-button">
          <i class="fas fa-link"></i>
          피치보기
        </button>
      </div>
    </div>

    <div class="route-info-section">
      <!-- <p>라우트 ID: {{ id }}</p> -->
      <!-- <h1 class="route-name">
        {{ routeDetails.name || "루트 이름 불러오는 중..." }}
      </h1> -->

      <ul class="route-details-list">
        <li>
          <i class="fas fa-user"></i>
          <span>이름</span>
          <p>{{ routeDetails.name || "정보 없음" }}</p>
        </li>
        <li>
          <i class="fas fa-circle-info"></i>
          <span>등반개요</span>
          <p>{{ routeDetails.overview || "정보 없음" }}</p>
        </li>
        <li>
          <i class="fas fa-stairs"></i>
          <span>등반형태</span>
          <p>{{ routeDetails.climbingStyle || "정보 없음" }}</p>
        </li>
        <li>
          <i class="fas fa-gears"></i>
          <span>등반장비</span>
          <p>{{ routeDetails.gear || "정보 없음" }}</p>
        </li>
        <li>
          <i class="fas fa-chart-line"></i>
          <span>평균난이도</span>
          <p>{{ routeDetails.difficulty || "정보 없음" }}</p>
        </li>
        <li>
          <i class="fas fa-book"></i>
          <span>개척자</span>
          <p>{{ routeDetails.firstAscentParty || "정보 없음" }}</p>
        </li>
      </ul>
    </div>

    <div class="pitch-list-section">
        <ul>
            <li><button>1.나비처럼</button></li>
            <li><button>2.노적갈매기</button></li>
            <li><button>3.마징가방망이</button></li>
            <li><button>4.웨딩마치</button></li>
        </ul>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, onMounted } from "vue";
// ✅✅✅ useRoute 임포트 및 route 변수 선언 라인 제거 ✅✅✅
// import { useRoute } from 'vue-router'; // 이 라인 삭제
// Firestore 임포트
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

// defineProps는 <script setup>에서 자동으로 인식됩니다.
// eslint-disable-next-line no-undef
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

// ✅✅✅ const route = useRoute(); 이 라인 삭제 ✅✅✅

// 라우트 상세 정보를 저장할 반응형 변수
const routeDetails = ref({
  name: null,
  overview: null,
  climbingStyle: null,
  gear: null,
  difficulty: null,
  firstAscentParty: null,
  // 필요한 다른 필드 추가
});

// 라우트 상세 정보를 Firestore에서 가져오는 함수
const fetchRouteDetails = async (routeId) => {
  console.log(
    `[RouteDetailView] 라우트 상세 정보 가져오기 시작 (ID: ${routeId})`
  );
  const routeDocRef = doc(db, "routes", routeId); // 실제 컬렉션 이름으로 수정
  try {
    const routeDoc = await getDoc(routeDocRef);
    if (routeDoc.exists()) {
      routeDetails.value = routeDoc.data();
      console.log(
        `[RouteDetailView] 라우트 상세 정보 가져옴:`,
        routeDetails.value
      );
    } else {
      console.warn(
        `[RouteDetailView] 라우트 문서 ${routeId}를 찾을 수 없습니다.`
      );
      // 정보 없을 때 기본값 상세하게 설정
      routeDetails.value = {
        name: "정보 없음",
        overview: "정보 없음",
        climbingStyle: "정보 없음",
        gear: "정보 없음",
        difficulty: "정보 없음",
        firstAscentParty: "정보 없음",
      };
    }
  } catch (e) {
    console.error(
      `[RouteDetailView] 라우트 상세 정보 가져오기 오류 (ID: ${routeId}):`,
      e
    );
    // 오류 발생 시 기본값 상세하게 설정
    routeDetails.value = {
      name: "오류 발생",
      overview: "오류 발생",
      climbingStyle: "오류 발생",
      gear: "오류 발생",
      difficulty: "오류 발생",
      firstAscentParty: "오류 발생",
    };
  }
};

// 컴포넌트 마운트 시 라우트 파라미터 ID를 사용하여 상세 정보 가져오기
onMounted(() => {
  // props.id를 사용하여 라우트 파라미터 ID 가져옴
  const currentRouteId = props.id;
  if (currentRouteId) {
    fetchRouteDetails(currentRouteId); // 상세 정보 가져오는 함수 호출
  } else {
    console.error("[RouteDetailView] 라우트 ID가 제공되지 않았습니다.");
  }
});

// 필요한 경우 다른 스크립트 로직 추가
</script>
  
  <style scoped>
/* 스타일은 변경 없습니다. */
.route-detail-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.route-image-section {
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
}

.route-diagram-img {
  width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.image-actions {
  margin-top: 10px;
}

.view-pitch-button {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.view-pitch-button:hover {
  background-color: #218838;
}

.view-pitch-button .icon {
  margin-right: 5px;
}
.view-pitch-button .fas {
  margin-right: 5px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
}

.route-info-section {
  margin-top: 20px;
  width: 100%;
  text-align: left;
}

.route-name {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 15px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.route-details-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.route-details-list li {
  display: flex;
  align-items: center;
  font-size: 1em;
  color: #555;
  line-height: 1.5;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.route-details-list li .fas {
  margin: 5px 10px 0 0;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: top;
  justify-content: center;
}

.route-details-list li span {
  width: 90px;
  color: #999;
}
.route-details-list li p {
  flex-grow: 1;
  word-break: break-word;
}

.icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.pitch-list-section{margin-top: 30px; width: 100%;}
.pitch-list-section > ul{}
.pitch-list-section > ul > li{}
.pitch-list-section > ul > li + li{margin-top: 10px;}
.pitch-list-section > ul > li > button{padding: 10px 20px; border: 1px solid #999; border-radius: 25px; width: 100%; background: #fff; text-align: left; font-size: 16px;}
.pitch-list-section > ul > li > button:hover{border-color:#218838; color: #218838;}
</style>