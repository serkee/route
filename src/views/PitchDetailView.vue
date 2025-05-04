<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>{{ currentPitchDetails ? currentPitchDetails.name || `${currentPitchDetails.number}피치` : '클라이밍 피치' }}</h1>
      <div class="header__right"></div>
    </div>

    <div class="pitch-list-section" v-if="allPitches.length > 0">
      <div class="pitch-buttons">
        <button
          v-for="pitch in allPitches"
          :key="pitch.id"
          @click="selectPitch(pitch.id)"
          :class="{ active: pitch.id === selectedPitchId }" class="pitch-button"
        >
          {{ pitch.name || `${pitch.number}피치` }}
        </button>
      </div>
    </div>
    <div v-else-if="!loading && allPitches.length === 0">
      <p>해당 루트의 피치 목록 정보가 없습니다.</p>
    </div>

    <div class="pitch-diagram-section">
      <img
        v-if="currentPitchDetails && currentPitchDetails.imagePath"
        :src="currentPitchDetails.imagePath"
        :alt="`Pitch ${currentPitchDetails.number} Diagram`"
        class="route-diagram-img"
      >
      <div v-else-if="!loading && !currentPitchDetails?.imagePath">
         <p>피치 다이어그램 이미지를 불러올 수 없습니다.</p>
      </div>
    </div>

    <div class="pitch-info-section" v-if="currentPitchDetails">
      <div class="info-row">
        <div class="info-item">
           <i class="fas fa-signature"></i> <span>이름 <strong>{{ currentPitchDetails.name || '정보 없음' }}</strong></span>
        </div>
        <div class="info-item">
          <i class="fas fa-ruler-vertical"></i>
          <span>길이 <strong>{{ currentPitchDetails.length || '정보 없음' }}</strong></span>
        </div>
      </div>
      <div class="info-row">
        
        <div class="info-item">
          <i class="fas fa-chart-simple"></i>
          <span>난이도 <strong>{{ currentPitchDetails.difficulty || '정보 없음' }}</strong></span>
        </div>
        <div class="info-item">
           <i class="fas fa-sliders-h"></i>
           <span>형태 <strong>{{ currentPitchDetails.climbingStyle || '정보 없음' }}</strong></span>
         </div>
      </div>
      
    </div>
    <div class="tools" v-if="currentPitchDetails">
        {{ currentPitchDetails.bolts }}
    </div>

     <div v-if="loading" class="loading-message">피치 정보 로딩 중...</div>
    <div v-if="error" class="error-message">피치 정보를 불러오는 데 오류가 발생했습니다: {{ error.message }}</div>
<button class="btn-feed" @click="goToWritePage">+ 피드쓰기</button>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */ // ESLint 'defineProps' 오류 비활성화

import { ref, onMounted, computed, nextTick } from 'vue'; // nextTick 임포트
// Firestore 관련 함수들
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

// 라우터 관련 훅
import { useRouter, useRoute } from 'vue-router';


const router = useRouter(); // 라우터 인스턴스 가져옴
const route = useRoute(); // 현재 루트 정보 가져옴


// props 정의 (루트 설정에서 컴포넌트로 전달)
const props = defineProps({
  routeId: {
    type: String,
    required: true
  },
  pitchId: {
    type: String,
    required: true // 라우터에서 pitchId 파라미터를 받을 것으로 예상
  }
});


const allPitches = ref([]); // 해당 루트의 모든 피치 목록
const selectedPitchId = ref(null); // 현재 화면에 상세 정보를 표시할 피치의 ID

const loading = ref(true); // 로딩 상태
const error = ref(null); // 오류 상태

// allPitches 목록과 selectedPitchId에 따라 현재 표시할 피치 상세 정보를 계산하는 computed 속성
const currentPitchDetails = computed(() => {
    const foundPitch = allPitches.value.find(pitch => pitch.id === selectedPitchId.value);
    console.log(`[PitchDetailView] computed - 현재 선택된 피치 ID: ${selectedPitchId.value}, 찾은 피치:`, foundPitch);
    return foundPitch;
});

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

// Firestore에서 특정 루트의 모든 피치 목록을 가져오는 함수
const fetchAllPitchesForRoute = async (routeId) => {
  console.log(`[PitchDetailView] 루트 "${routeId}"의 모든 피치 목록 Firestore에서 가져오기 시작.`);
  loading.value = true;
  error.value = null;
  allPitches.value = []; // 이전 데이터 초기화

  // Firestore 경로: routes/{routeId}/pitches
  const pitchesCollectionRef = collection(db, 'routes', routeId, 'pitches');
  try {
    // 피치 번호(number) 순으로 정렬하여 조회
    const q = query(pitchesCollectionRef, orderBy('number', 'asc'));
    const querySnapshot = await getDocs(q);

    const pitchesList = [];
    querySnapshot.forEach(doc => {
      // 문서 ID를 피치 ID로 사용하고, 나머지 필드를 포함
      pitchesList.push({
        id: doc.id, // 문서 ID를 피치 ID로 사용
        ...doc.data() // Firestore 문서의 나머지 필드 (name, length, difficulty, imagePath, bolts 등)
      });
    });
    allPitches.value = pitchesList;
    console.log(`[PitchDetailView] 루트 "${routeId}"의 모든 피치 ${pitchesList.length}개 가져옴:`, allPitches.value);

    // 초기 선택할 피치 설정 로직
    const initialPitchIdFromUrl = props.pitchId;
    let pitchIdToSelect = null;
    let needsUrlUpdate = false;


    // 1. URL의 초기 pitchId가 유효한지 확인
    const foundInitialPitch = allPitches.value.find(p => p.id === initialPitchIdFromUrl);

    if (foundInitialPitch) {
        pitchIdToSelect = initialPitchIdFromUrl;
        console.log(`[PitchDetailView] URL 초기 피치 ID "${initialPitchIdFromUrl}"에 해당하는 피치를 찾았습니다.`);
    } else if (allPitches.value.length > 0) {
        // 2. URL의 pitchId가 유효하지 않거나 없는 경우, 첫 번째 피치를 선택
        // ✅ 첫 번째 피치의 ID가 유효한지 추가 확인
         if (allPitches.value[0]?.id) {
            pitchIdToSelect = allPitches.value[0].id;
            console.warn(`[PitchDetailView] 초기 피치 ID "${initialPitchIdFromUrl}"를 찾을 수 없어 첫 번째 피치 "${pitchIdToSelect}"를 선택합니다. URL 업데이트 필요.`);
            needsUrlUpdate = true; // URL 업데이트 플래그 설정
         } else {
             // 첫 번째 피치의 ID가 유효하지 않은 경우
             console.error("[PitchDetailView] 가져온 피치 목록의 첫 번째 피치 ID가 유효하지 않습니다.", allPitches.value[0]);
             // 선택할 피치 없음 상태 유지 (pitchIdToSelect는 null)
             pitchIdToSelect = null;
         }

    } else {
      // 3. 해당 루트에 피치가 없는 경우
      pitchIdToSelect = null; // 선택할 피치 없음
      console.warn(`[PitchDetailView] 루트 "${routeId}"에는 등록된 피치가 없습니다.`);
    }

    // 선택된 피치 ID 상태 업데이트
    selectedPitchId.value = pitchIdToSelect;

    // 필요한 경우에만 URL 업데이트 (선택할 피치가 있을 때만)
    if (needsUrlUpdate && pitchIdToSelect) {
        console.log("[PitchDetailView] router.replace 호출 직전 값 확인:");
        console.log("  routeId:", props.routeId);
        console.log("  pitchIdToSelect:", pitchIdToSelect);

        // nextTick을 사용하여 DOM 업데이트 이후 루트 이동을 시도 (타이밍 문제 방지 시도)
        nextTick(() => {
           router.replace({ params: { routeId: props.routeId, pitchId: pitchIdToSelect } });
           console.log("[PitchDetailView] router.replace 호출됨.");
        }).catch(err => {
            console.error("[PitchDetailView] router.replace 중 오류 발생:", err);
             error.value = new Error(`URL 업데이트 중 오류 발생: ${err.message}`); // 사용자에게 오류 표시
        });

    } else if (!pitchIdToSelect && allPitches.value.length > 0) {
         // 피치 목록은 있지만 유효한 피치를 선택할 수 없는 경우
         console.error("[PitchDetailView] 가져온 피치 목록에서 유효한 피치를 선택할 수 없습니다.");
         error.value = new Error("피치 데이터를 불러왔으나 표시할 피치를 찾을 수 없습니다.");
         // 선택적으로 이전 페이지로 이동 또는 오류 상태 표시 강화
    } else if (!pitchIdToSelect && allPitches.value.length === 0 && !loading.value) {
         // 피치 목록 자체가 없는 경우는 상단 v-else-if에서 메시지 표시
         console.log("[PitchDetailView] 피치 목록 없음, router.replace 건너뜜.");
    }


  } catch (e) {
    console.error(`[PitchDetailView] 루트 "${routeId}"의 모든 피치 목록 Firestore에서 가져오기 오류:`, e);
    error.value = e;
  } finally {
    loading.value = false;
    console.log("[PitchDetailView] Firestore 피치 로딩 완료.");
  }
};


// 피치 선택 버튼 클릭 시 호출될 함수
const selectPitch = (pitchId) => {
  console.log(`[PitchDetailView] 피치 선택 버튼 클릭: ${pitchId}`);
  // 선택된 피치 ID가 현재 allPitches 목록에 있는지 확인
  const pitchExists = allPitches.value.some(p => p.id === pitchId);

  if (pitchExists && selectedPitchId.value !== pitchId) {
    console.log(`[PitchDetailView] 피치 "${pitchId}" 선택.`);
    selectedPitchId.value = pitchId;
    // URL의 pitchId를 선택된 피치 ID로 업데이트 (페이지 이동 없음, URL만 변경)
    router.replace({ params: { routeId: props.routeId, pitchId: pitchId } })
      .catch(err => {
           console.error("[PitchDetailView] selectPitch - router.replace 중 오류 발생:", err);
           // selectPitch 자체는 오류를 throw하지 않고, 오류 메시지만 표시
           error.value = new Error(`피치 선택 후 URL 업데이트 중 오류 발생: ${err.message}`);
      });
  } else if (selectedPitchId.value === pitchId) {
      console.log(`[PitchDetailView] 피치 "${pitchId}" 이미 선택됨.`);
  }
   else {
    console.warn(`[PitchDetailView] 피치 목록에 없는 피치 ID "${pitchId}" 선택 시도.`);
     // 목록에 없는 피치 선택 시 오류 메시지 표시
     error.value = new Error(`피치 목록에 없는 피치 ID (${pitchId}) 입니다.`);
  }
};


// 뒤로가기 함수
const goBack = () => {
  console.log("[PitchDetailView] 뒤로가기 버튼 클릭.");
  router.go(-1); // 이전 페이지로 이동
};


// 컴포넌트 마운트 시 실제 Firestore 데이터를 로드합니다.
onMounted(() => {
  const { routeId, pitchId } = props; // props에서 routeId와 pitchId 가져옴
  console.log(`[PitchDetailView] 마운트됨. 루트 ID: ${routeId}, 초기 피치 ID: ${pitchId}. Firestore 데이터 로딩 시작.`);
  if (routeId) { // routeId가 유효하면 데이터 로드 시작
    fetchAllPitchesForRoute(routeId); // 실제 Firestore 조회 함수 호출
  } else {
    console.error("[PitchDetailView] 루트 ID가 제공되지 않았습니다. 피치 데이터를 불러올 수 없습니다.");
    loading.value = false; // 로딩 상태 해제
    error.value = new Error("루트 정보를 찾을 수 없습니다."); // 오류 상태 설정
  }
});
</script>


<style scoped>
.container > div {
  width: 100%;
}

.page-title {
  text-align: center;
  font-size: 1.5em;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee; /* 하단 구분선 */
  padding-bottom: 10px;
}

.pitch-diagram-section {
  border: 2px solid #218838;
  border-width: 2px 0;
  padding-top: 20px;
  text-align: center;
}

.route-diagram-img {
  width: 100%;
  height: auto;
}

.pitch-info-section {
  text-align: left;
  border-bottom: 1px solid #e1e1e1;
  padding: 15px 10px;
}

.info-row {
  display: flex; /* 아이템들을 가로로 */
  justify-content: space-between; /* 아이템 사이 공간 균등 분배 */
  /*flex-wrap: wrap; /* 공간 부족 시 줄바꿈 */
}
.info-row + .info-row {
  margin-top: 10px;
}

.info-item {
  display: flex; /* 아이콘과 텍스트를 가로로 */
  align-items: center;
  font-size: 1em;
  color: #555;
  /*flex: 1; /* 공간 분배 */
  width: 48%; /* 한 줄에 두 개씩 배치 (조정 가능) */
  box-sizing: border-box;
  /*padding-right: 10px; /* 아이템 간 오른쪽 패딩 */
}

.info-item.full-width {
  /* 볼트 개수처럼 한 줄 전체 사용하는 경우 */
  width: 100%;
}

.info-item .fas {
  /* Font Awesome icon */
  margin-right: 10px;
  flex-shrink: 0; /* 아이콘 크기 고정 */
  color: #999; /* 아이콘 색상 (예시) */
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-item span {
  flex-grow: 1;
  word-break: break-word; /* 긴 텍스트 줄바꿈 */
  font-size: 14px;
}
.info-item span strong {
  font-size: 15px;
  color: rgb(19, 177, 56);
}

.tools-row {
  margin: 20px 0 40px;
  text-align: left;
  font-size: 16px;
  font-weight: 500;
}

.pitch-list-section {
  text-align: left;
  margin-bottom: 20px;
}
.pitch-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 5px;
}
.pitch-buttons > button {
  padding: 10px 0;
  background: #eee;
  border: 0;
  border-radius: 30px;
  color: #a1a1a1;
}
.pitch-buttons > button.active {
  background: rgb(19, 177, 56);
  color: #fff;
  font-weight: bold;
}

.tools{text-align: left; padding: 20px 0 0 0;}

/* 이전의 .icon 클래스 스타일은 더 이상 필요 없거나 조정 필요 */
</style>