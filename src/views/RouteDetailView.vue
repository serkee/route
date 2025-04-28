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
        <button class="view-pitch-button" @click="goToPitchDetail(pitches[0]?.id)"
            :disabled="pitches.length === 0">
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

    <div class="pitch-list-section" v-if="pitches.length > 0">
        <!-- <h3>피치 선택</h3> -->
        <div class="pitch-buttons">
            <button
                v-for="pitch in pitches"
                :key="pitch.id"
                @click="goToPitchDetail(pitch.id)"
                class="pitch-button"
            >
                {{ pitch.name || `${pitch.number}피치` }} </button>
        </div>
    </div>
    <div v-else-if="!loading">
        <p>해당 라우트의 피치 정보가 없습니다.</p>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
// Firestore related imports
// ✅✅✅ 아래 ESLint 주석을 추가하여 Firestore 관련 임포트 오류 무시 ✅✅✅
// eslint-disable-next-line no-unused-vars, no-undef
import { doc, getDoc, collection as firestoreCollection, query as firestoreQuery, getDocs as firestoreGetDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'vue-router';


// eslint-disable-next-line no-undef
const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const router = useRouter();

const routeDetails = ref({
  name: null, overview: null, climbingStyle: null, gear: null, difficulty: null, firstAscentParty: null,
});

const pitches = ref([]);
const loading = ref(true);
const error = ref(null);


const fetchRouteDetails = async (routeId) => {
  console.log(`[RouteDetailView] 라우트 상세 정보 가져오기 시작 (ID: ${routeId})`);
   loading.value = true;
   error.value = null;

  const routeDocRef = doc(db, 'routes', routeId); // 실제 컬렉션 이름으로 수정
  try {
    const routeDoc = await getDoc(routeDocRef);
    if (routeDoc.exists()) {
      routeDetails.value = routeDoc.data();
      console.log(`[RouteDetailView] 라우트 상세 정보 가져옴:`, routeDetails.value);
    } else {
      console.warn(`[RouteDetailView] 라우트 문서 ${routeId}를 찾을 수 없습니다.`);
      routeDetails.value = { name: '정보 없음', overview: '정보 없음', climbingStyle: '정보 없음', gear: '정보 없음', difficulty: '정보 없음', firstAscentParty: '정보 없음' };
    }
  } catch (e) {
    console.error(`[RouteDetailView] 라우트 상세 정보 가져오기 오류 (ID: ${routeId}):`, e);
    error.value = e;
     routeDetails.value = { name: '오류 발생', overview: '오류 발생', climbingStyle: '오류 발생', gear: '오류 발생', difficulty: '오류 발생', firstAscentParty: '오류 발생' };
  } finally {
       // 로딩 완료는 피치 정보까지 모두 가져온 후에 처리하는 것이 좋습니다.
  }
};
const goBack = () => {
    console.log("[PitchDetailView] 뒤로가기 버튼 클릭.");
    router.go(-1);
};

const samplePitches = [
  { id: 'pitch-1', number: 1, name: '1피치', length: '20m', difficulty: '5.8', climbingStyle: '슬랩', bolts: 3 },
  { id: 'pitch-2', number: 2, name: '2피치', length: '25m', difficulty: '5.9', climbingStyle: '크랙', bolts: 4 },
  { id: 'pitch-3', number: 3, name: '3피치', length: '30m', difficulty: '5.10a', climbingStyle: '페이스', bolts: 5 },
  { id: 'pitch-4', number: 4, name: '4피치', length: '27m', difficulty: '5.10b', climbingStyle: '오버행', bolts: 4 },
];

const loadSamplePitches = () => {
    console.log("[RouteDetailView] 샘플 피치 목록 로딩.");
    pitches.value = samplePitches;
    loading.value = false;
};


// ✅✅✅ 아래 ESLint 주석을 추가하여 함수 정의 오류 및 파라미터 오류 무시 ✅✅✅
// eslint-disable-next-line no-unused-vars
const fetchPitchesForRoute = async (routeId) => {
    console.log(`[RouteDetailView] 라우트 "${routeId}"의 피치 목록 가져오기 시작.`);
    pitches.value = [];
    const pitchesCollectionRef = firestoreCollection(db, 'routes', routeId, 'pitches'); // 실제 경로로 수정
    try {
        const q = firestoreQuery(pitchesCollectionRef, orderBy('number', 'asc')); // 'number' 필드명 확인 필요
        const querySnapshot = await firestoreGetDocs(q);

        const pitchesList = [];
        querySnapshot.forEach(doc => {
            pitchesList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        pitches.value = pitchesList;
        console.log(`[RouteDetailView] 라우트 "${routeId}"의 피치 ${pitchesList.length}개 가져옴:`, pitchesList);
    } catch (e) {
        console.error(`[RouteDetailView] 라우트 "${routeId}"의 피치 목록 가져오기 오류:`, e);
         error.value = e;
    } finally {
        loading.value = false;
    }
};


const goToPitchDetail = (pitchId) => {
    if (!pitchId) {
        console.warn("[RouteDetailView] 선택할 피치 ID가 없습니다.");
        return;
    }
    console.log(`[RouteDetailView] 피치 선택: ${pitchId}. 상세 페이지로 이동.`);
    router.push({
        name: 'pitchDetail',
        params: {
            routeId: props.id,
            pitchId: pitchId
        }
    });
};


onMounted(() => {
  const currentRouteId = props.id;
  if (currentRouteId) {
    fetchRouteDetails(currentRouteId);
    // fetchPitchesForRoute(currentRouteId); // ✅ 실제 Firestore 조회 대신 이 라인을 주석 처리
    loadSamplePitches(); // ✅ 대신 샘플 피치 로딩 함수 호출
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
.pitch-buttons button{padding: 10px 20px; border: 1px solid #999; border-radius: 25px; width: 100%; background: #fff; text-align: left; font-size: 16px;}
.pitch-buttons button:hover{border-color:#218838; color: #218838;}
.pitch-buttons button + button{margin-top: 10px;}
</style>