<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>{{ routeDetails.name }}</h1>
      <div class="header__right"></div>
    </div>

    <div class="route-image-section">
      <img
        v-if="routeDetails && routeDetails.mainImageUrl"
        :src="routeDetails.mainImageUrl"
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
          @click="goToPitchDetail(pitches[0]?.id)"
          :disabled="pitches.length === 0"
        >
          <i class="fas fa-link"></i>
          피치보기
        </button>
      </div>
    </div>

    <div class="route-info-section">
      <!-- <p>라우트 ID: {{ id }}</p> -->
<!-- 
      <h1 class="route-name">
        {{ routeDetails.name || "루트 이름 불러오는 중..." }}
      </h1> -->

      <ul class="route-details-list">
        <!-- <li>
          <i class="fas fa-location-dot"></i>
          <span>이름 - {{ routeDetails.name || "정보 없음" }}</span>
        </li> -->
        <li>
          <i class="fas fa-file-lines"></i>
          <span>등반개요</span>
          <strong>{{ routeDetails.overview || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-sliders-h"></i>
          <span>등반형태</span>
            <strong>{{ routeDetails.climbingStyle || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-gears"></i>
          <span>등반장비</span>
          <strong>{{ routeDetails.gear || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-chart-simple"></i>
          <span>평균난이도</span>
          <strong>{{ routeDetails.difficulty || "정보 없음" }}</strong>
        </li>
        <li>
          <i class="fas fa-book"></i>
          <span>개척자</span>
          <strong>{{ routeDetails.firstAscentParty || "정보 없음" }}</strong>
        </li>
      </ul>
    </div>

    <div class="pitch-list-section" v-if="pitches.length > 0">
      <!-- <h3>피치 선택</h3> -->
      <div class="pitch-buttons">
        <button
          v-for="pitch in pitches"
          :key="pitch.id"
          @click="goToPitchDetail(pitch.id)"
          class="pitch-button"
        >
          {{ pitch.name || `${pitch.number}피치` }}
        </button>
      </div>
    </div>
    <div v-else-if="!loading">
      <p>해당 라우트의 피치 정보가 없습니다.</p>
    </div>

    <div v-if="loading" class="loading-message">정보 로딩 중...</div>
    <div v-if="error" class="error-message">
      데이터 로딩 오류: {{ error.message }}
    </div>
  </div>
</template>
  
  <script setup>
import { ref, onMounted } from "vue";
// ✅✅✅ Firestore 관련 함수 임포트 ✅✅✅
import {
  doc,
  getDoc,
  collection as firestoreCollection,
  query as firestoreQuery,
  getDocs as firestoreGetDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "vue-router";

// eslint-disable-next-line no-undef
const props = defineProps({
  id: {
    // 라우트 ID (params에서 props로 받음)
    type: String,
    required: true,
  },
});

const router = useRouter();

const routeDetails = ref({
  name: null,
  overview: null,
  climbingStyle: null,
  gear: null,
  difficulty: null,
  firstAscentParty: null,
  mainImageUrl: null, // ✅ mainImageUrl 필드 추가
});

const pitches = ref([]); // 피치 목록을 저장할 반응형 변수
const loading = ref(true); // 로딩 상태
const error = ref(null); // 오류 상태

// ✅✅✅ 라우트 상세 정보를 Firestore에서 가져오는 함수 ✅✅✅
const fetchRouteDetails = async (routeId) => {
  console.log(
    `[RouteDetailView] 라우트 상세 정보 가져오기 시작 (ID: ${routeId}).`
  );
  loading.value = true;
  error.value = null;

  const routeDocRef = doc(db, "routes", routeId);
  try {
    const routeDoc = await getDoc(routeDocRef);
    if (routeDoc.exists()) {
      const data = routeDoc.data();
      routeDetails.value = {
        ...data,
        // ✅✅✅ Firestore 문서에서 'mainImageUrl' 필드 값을 가져옵니다. ✅✅✅
        mainImageUrl: data.mainImageUrl || null, // 실제 Firestore 필드명 'mainImageUrl'로 가정
      };
      console.log(
        `[RouteDetailView] 라우트 상세 정보 가져옴:`,
        routeDetails.value
      );
    } else {
      console.warn(
        `[RouteDetailView] 라우트 문서 ${routeId}를 찾을 수 없습니다.`
      );
      routeDetails.value = {
        name: "정보 없음",
        overview: "정보 없음",
        climbingStyle: "정보 없음",
        gear: "정보 없음",
        difficulty: "정보 없음",
        firstAscentParty: "정보 없음",
        mainImageUrl: null,
      }; // 기본값 및 이미지 필드 초기화
    }
  } catch (e) {
    console.error(
      `[RouteDetailView] 라우트 상세 정보 가져오기 오류 (ID: ${routeId}):`,
      e
    );
    error.value = e;
    routeDetails.value = {
      name: "오류 발생",
      overview: "오류 발생",
      climbingStyle: "오류 발생",
      gear: "오류 발생",
      difficulty: "오류 발생",
      firstAscentParty: "오류 발생",
      mainImageUrl: null,
    };
  } finally {
    // 로딩 완료는 피치 정보까지 모두 가져온 후에 처리하는 것이 좋습니다.
  }
};

// ✅✅✅ 특정 라우트의 피치 목록을 Firestore에서 가져오는 함수 ✅✅✅
// 라우트 문서의 서브컬렉션 ('pitches')에서 가져온다고 가정 (실제 경로로 수정)
const fetchPitchesForRoute = async (routeId) => {
  console.log(
    `[RouteDetailView] 라우트 "${routeId}"의 피치 목록 가져오기 시작 (Firestore).`
  );
  // loading.value = true; // 라우트 상세와 함께 로딩 시작했으므로 여기서 다시 할 필요 없음
  // error.value = null;
  pitches.value = []; // 이전 피치 목록 초기화

  // 'routes/{routeId}/pitches' 경로의 서브컬렉션 참조 (실제 경로로 수정)
  const pitchesCollectionRef = firestoreCollection(
    db,
    "routes",
    routeId,
    "pitches"
  );
  try {
    // 피치 번호(number 필드) 기준으로 오름차순 정렬하여 가져옴 (실제 필드명 확인)
    const q = firestoreQuery(pitchesCollectionRef, orderBy("number", "asc")); // 'number' 필드명 확인 필요
    const querySnapshot = await firestoreGetDocs(q);

    const pitchesList = [];
    querySnapshot.forEach((doc) => {
      pitchesList.push({
        id: doc.id, // 피치 문서 ID
        ...doc.data(), // 피치 데이터 (name, number 등 실제 필드명 확인)
      });
    });
    pitches.value = pitchesList; // 가져온 피치 목록 저장
    console.log(
      `[RouteDetailView] 라우트 "${routeId}"의 피치 ${pitchesList.length}개 가져옴:`,
      pitchesList
    );
  } catch (e) {
    console.error(
      `[RouteDetailView] 라우트 "${routeId}"의 피치 목록 가져오기 오류:`,
      e
    );
    error.value = e; // 오류 상태 저장
  } finally {
    loading.value = false; // 라우트 및 피치 정보 로딩 완료
  }
};

// 특정 피치 상세 페이지로 이동하는 함수
const goToPitchDetail = (pitchId) => {
  // 피치 ID가 유효한지 확인
  if (!pitchId) {
    console.warn("[RouteDetailView] 선택할 피치 ID가 없습니다.");
    return;
  }
  console.log(`[RouteDetailView] 피치 선택: ${pitchId}. 상세 페이지로 이동.`);
  // 'pitchDetail' 라우트 이름과 routeId, pitchId 파라미터를 가지고 이동
  // props.id를 사용하여 현재 라우트 ID 전달
  router.push({
    name: "pitchDetail", // router/index.js에서 정의한 피치 상세 라우트 이름
    params: {
      routeId: props.id, // 현재 라우트의 ID (props에서 가져옴)
      pitchId: pitchId, // 선택된 피치의 ID
    },
  });
};

// 컴포넌트 마운트 시 라우트 상세 정보와 피치 목록을 가져옵니다.
onMounted(() => {
  const currentRouteId = props.id;
  if (currentRouteId) {
    fetchRouteDetails(currentRouteId);
    fetchPitchesForRoute(currentRouteId);
  } else {
    console.error("[RouteDetailView] 라우트 ID가 제공되지 않았습니다.");
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
  margin-top: 10px;
}
</style>