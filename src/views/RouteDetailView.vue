<template>
  <div class="container" v-if="routeDetails">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>{{ routeDetails.name || '루트 이름' }}</h1>
      <div class="header__right"></div>
    </div>

    <div class="route-image-section">
      <img
        v-if="routeDetails && routeDetails.imageUrl"
        :src="routeDetails.imageUrl"
        :alt="
          routeDetails.name
            ? `${routeDetails.name} 다이어그램`
            : '등반 루트 다이어그램'
        "
        class="route-diagram-img"
      />
      <div v-else-if="!loading">
        <p>루트 다이어그램 이미지를 불러올 수 없습니다.</p>
      </div>

      <div class="image-actions">
        <button
          class="view-pitch-button"
          @click="goToPitchDetail(pitches[0]?.id)" :disabled="pitches.length === 0 || pitches[0]?.id == null || pitches[0]?.id === ''" >
          <i class="fas fa-link"></i>
          피치보기 (첫 피치)
        </button>
      </div>
    </div>

    <div class="route-info-section">
      <ul class="route-details-list">
        <li>
          <i class="fas fa-file-lines"></i>
          <span>등반개요</span>
          <strong>{{ routeDetails.climbingOverview || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-sliders-h"></i>
          <span>등반형태</span>
            <strong>{{ routeDetails.climbingStyle || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-gears"></i>
          <span>등반장비</span>
          <strong>{{ routeDetails.climbingGear || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-chart-simple"></i>
          <span>평균난이도</span>
          <strong>{{ routeDetails.averageDifficulty || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-book"></i>
          <span>개척자</span>
          <strong>{{ routeDetails.developer || "정보 없음" }}</strong>
        </li>
         <li>
            <i class="fas fa-calendar-alt"></i>
            <span>등록일</span>
            <strong>{{ formatDate(routeDetails.timestamp) }}</strong>
         </li>
      </ul>
    </div>

    <div class="pitch-list-section" v-if="pitches.length > 0">
      <!-- <h3>피치 선택</h3> -->
      <div class="pitch-buttons">
        <button
          v-for="pitch in pitches"
          :key="pitch.id" @click="goToPitchDetail(pitch.id)" class="pitch-button"
           :disabled="pitch.id == null || pitch.id === ''" >
          {{ pitch.name || `${pitch.number}피치` }}
        </button>
      </div>
    </div>
     <div v-else-if="!loading">
       <p>해당 루트의 피치 정보가 없습니다.</p>
     </div>

    <div v-if="loading" class="loading-message">정보 로딩 중...</div>
    <div v-if="error" class="error-message">
      데이터 로딩 오류: {{ error.message }}
    </div>
  </div>
   <div v-else-if="!loading && !routeDetails && !error">
       <p>해당 루트 정보를 찾을 수 없습니다.</p>
   </div>
   <button class="btn-feed" @click="goToWritePage">+ 피드쓰기</button>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
// Firestore 관련 함수 임포트
import {
  doc,
  getDoc,
  collection as firestoreCollection,
  query as firestoreQuery,
  getDocs as firestoreGetDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";


const router = useRouter();
const route = useRoute();


// eslint-disable-next-line no-undef
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const routeDetails = ref(null);
const pitches = ref([]);
const loading = ref(true);
const error = ref(null);

// Firestore 컬렉션 참조
const routesCollectionRef = firestoreCollection(db, 'routes');


// 날짜 포맷팅 헬퍼 함수
const formatDate = (timestamp) => {
  if (!timestamp) return '정보 없음';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
const goToWritePage = () => {
  // 현재 페이지의 전체 URL을 가져옵니다. (호스트 이름 포함)
  const currentRouteLink = route.fullPath;

  console.log("[RouteDetailView] '피드쓰기' 버튼 클릭됨.");
  console.log("전달할 카테고리:", '루트');
  console.log("전달할 현재 페이지 링크:", currentRouteLink);

  // /board/write 경로로 이동하면서 쿼리 파라미터 전달
  router.push({
    path: "/board/write",
    query: {
      category: 'route', // 카테고리를 '루트'로 설정
      linkedRouteUrl: currentRouteLink // 현재 페이지 링크 전달
    }
  });
};

// 루트 상세 정보를 Firestore에서 가져오는 함수
const fetchRouteDetails = async (routeId) => {
  console.log(
    `[RouteDetailView] 루트 상세 정보 가져오기 시작 (ID: ${routeId}).`
  );
  loading.value = true;
  error.value = null;

  const routeDocRef = doc(db, "routes", routeId);
  try {
    const routeDoc = await getDoc(routeDocRef);
    if (routeDoc.exists()) {
      const data = routeDoc.data();
      routeDetails.value = {
        id: routeDoc.id, // Include the document ID
        ...data,
        imageUrl: data.imageUrl || null,
         climbingOverview: data.climbingOverview || '',
         climbingStyle: data.climbingStyle || '',
         climbingGear: data.climbingGear || '',
         averageDifficulty: data.averageDifficulty || '',
         developer: data.developer || '',
         timestamp: data.timestamp || null,
         location: data.location || { lat: '정보 없음', lng: '정보 없음' }
      };
      console.log(
        `[RouteDetailView] 루트 상세 정보 가져옴:`,
        routeDetails.value
      );
    } else {
      console.warn(
        `[RouteDetailView] 루트 문서 ${routeId}를 찾을 수 없습니다.`
      );
      routeDetails.value = null;
    }
  } catch (e) {
    console.error(
      `[RouteDetailView] 루트 상세 정보 가져오기 오류 (ID: ${routeId}):`,
      e
    );
    error.value = e;
    routeDetails.value = null;
  } finally {
    // loading state is set to false after fetching pitches
  }
};


// ✅✅✅ 특정 루트의 피치 목록을 Firestore에서 가져오는 함수 - ID 우선 순위 수정 ✅✅✅
const fetchPitchesForRoute = async (routeId) => {
  console.log(
    `[RouteDetailView] 루트 "${routeId}"의 피치 목록 가져오기 시작 (Firestore).`
  );
  pitches.value = []; // 이전 피치 목록 초기화

  const pitchesCollectionRef = firestoreCollection(
    db,
    "routes",
    routeId,
    "pitches"
  );
  try {
    const q = firestoreQuery(pitchesCollectionRef, orderBy("number", "asc"));
    const querySnapshot = await firestoreGetDocs(q);

    const pitchesList = [];
    querySnapshot.forEach((doc) => {
      const pitchData = doc.data();
      pitchesList.push({
        ...pitchData, // 먼저 문서 데이터를 펼치고,
        id: doc.id, // ✅ 그 다음에 문서 ID로 'id' 필드를 덮어씁니다. (Turn 299의 수정 내용)
         // Ensure other relevant fields are included
         number: pitchData.number || null,
         name: pitchData.name || '',
         length: pitchData.length || '',
         difficulty: pitchData.difficulty || '',
         climbingStyle: pitchData.climbingStyle || '',
         bolts: pitchData.bolts || null,
         imagePath: pitchData.imagePath || '',
      });
    });
    pitches.value = pitchesList; // 가져온 피치 목록 저장
    console.log(
      `[RouteDetailView] 루트 "${routeId}"의 피치 ${pitchesList.length}개 가져옴:`,
      pitchesList
    );
     console.log("[RouteDetailView] Fetched pitches data (with correct ID):", pitches.value);

  } catch (e) {
    console.error(
      `[RouteDetailView] 루트 "${routeId}"의 피치 목록 가져오기 오류:`,
      e
    );
    pitches.value = [];
  } finally {
    loading.value = false;
  }
};


// 뒤로가기 함수
const goBack = () => {
  console.log("[RouteDetailView] 뒤로가기 버튼 클릭.");
  router.go(-1);
};


// ✅✅✅ 특정 피치 상세 페이지로 이동하는 함수 (다시 ID 사용) ✅✅✅
const goToPitchDetail = (pitchId) => { // 매개변수 이름을 pitchId로 되돌림
  const currentRouteId = route.params.id;

  console.log("[RouteDetailView] goToPitchDetail 호출됨.");
  console.log(`[RouteDetailView] 현재 루트 ID (params): ${currentRouteId}`);
  console.log(`[RouteDetailView] 클릭된 피치 ID:`, pitchId); // ID 로깅


  // 피치 ID가 유효한지 확인 (null, undefined, 빈 문자열 체크)
  if (pitchId == null || pitchId === '') {
    console.warn("[RouteDetailView] 선택할 피치 ID가 없습니다. 전달받은 값:", pitchId);
    alert("피치 정보를 찾을 수 없습니다.");
    return;
  }
  // 현재 루트 ID가 유효한지 확인 (필요하다면)
  if (!currentRouteId) {
       console.error("[RouteDetailView] 현재 루트 ID를 찾을 수 없어 피치 상세로 이동할 수 없습니다. (Params ID:", route.params.id, ")");
       alert("루트 정보를 찾을 수 없어 피치 상세 페이지로 이동할 수 없습니다.");
       return;
  }


  console.log(`[RouteDetailView] 피치 선택: 피치 ID ${pitchId}. 상세 페이지로 이동.`);

  // TODO: router/index.js에 'pitchDetail' 루트를 정의하고, PitchDetailView.vue 컴포넌트 생성 필요
  // 'pitchDetail' 루트는 '/admin/routes/:routeId/pitches/:pitchId' 형식일 가능성이 높습니다. (다시 ID 사용)
  router.push({
    name: "pitchDetail", // router/index.js에서 정의할 피치 상세 루트 이름
    params: {
      routeId: currentRouteId, // 현재 루트의 ID
      pitchId: pitchId, // ✅ 피치 번호 대신 피치 ID 전달 (문서 ID)
    },
  }).catch(err => {
    console.error("[RouteDetailView] 루트 이동 오류:", err);
    alert(`피치 상세 페이지로 이동 중 오류 발생: ${err.message}\n'pitchDetail' 루트 및 루트 파라미터(routeId, pitchId)가 올바르게 설정되었는지 확인하세요.`);
  });
};


// 컴포넌트 마운트 시 루트 상세 정보와 피치 목록을 가져옵니다.
onMounted(() => {
  const currentRouteId = props.id;

  if (currentRouteId) {
    fetchRouteDetails(currentRouteId);
    fetchPitchesForRoute(currentRouteId);
  } else {
    console.error("[RouteDetailView] 루트 ID가 props로 제공되지 않았습니다.");
    error.value = new Error("표시할 루트 정보를 찾을 수 없습니다 (ID 누락).");
    loading.value = false;
  }
});
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
  margin-bottom: 10px;
  width: 100%;
}

.route-diagram-img {
  width: 100%;
  height: auto;
  
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
  margin: 0 0 30px;
  border: 2px solid #218838;
  border-width: 2px 0;

}

.route-details-list li {
  display: flex;
  font-size: 1em;
  color: #555;
  line-height: 1.5;
  border-top: 1px solid #eee;
  padding: 10px 0;
}
.route-details-list li:first-child{
  border-top: 0;
}

.route-details-list li .fas {
  margin: 1px 10px 0 0;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

}

.route-details-list li span {
  width: 72px;
  color: #999;
  font-size: 14px;
  margin-top: 2px;
}
.route-details-list li strong{
  flex: 1;
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
.pitch-list-section {
  width: 100%;
}
.pitch-buttons{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}
.pitch-buttons button {
  padding: 10px 20px;
  border: 1px solid #999;
  border-radius: 25px;
  width: 100%;
  background: #fff;
  text-align: left;
  font-size: 16px;
}
.pitch-buttons button:hover {
  border-color: #218838;
  color: #218838;
}
.pitch-buttons button + button {
  /* margin-top: 10px;   */
}
</style>