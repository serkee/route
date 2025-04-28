<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>클라이밍 피치</h1>
      <div class="header__right"></div>
    </div>

    <div class="pitch-diagram-section">
       <img src="@/assets/images/contents/@map.jpg" alt="노적봉 서면 등반 루트 다이어그램" class="route-diagram-img">
    </div>

    <div class="pitch-info-section" v-if="currentPitchDetails">
        <div class="info-row">
            <div class="info-item">
                <i class="fas fa-location-dot"></i>
                <span>이름 - {{ currentPitchDetails.name || '정보 없음' }}</span>
            </div>
             <div class="info-item">
                <i class="fas fa-ruler-vertical"></i>
                <span>길이 - {{ currentPitchDetails.length || '정보 없음' }}</span>
            </div>
        </div>
         <div class="info-row">
             <div class="info-item">
                <i class="fas fa-chart-simple"></i>
                <span>난이도 - {{ currentPitchDetails.difficulty || '정보 없음' }}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-sliders-h"></i>
                <span>형태 - {{ currentPitchDetails.climbingStyle || '정보 없음' }}</span>
            </div>
        </div>
         
    </div>
    <div class="tools-row">
        <div class="info-item full-width">
            <i class="fas fa-cog"></i>
            <span>볼트 1개</span>
        </div>
    </div>


    <div class="pitch-list-section" v-if="allPitches.length > 0">
        <h3>피치 선택</h3>
        <div class="pitch-buttons">
            <button
                v-for="pitch in allPitches"
                :key="pitch.id"
                @click="selectPitch(pitch.id)"
                :class="{ active: pitch.id === selectedPitchId }" class="pitch-button"
            >
                {{ pitch.name || `${pitch.number}피치` }} </button>
        </div>
    </div>
     <div v-else-if="!loading && allPitches.length === 0">
        <p>해당 라우트의 피치 목록 정보가 없습니다.</p>
    </div>

    <div v-if="loading" class="loading-message">피치 정보 로딩 중...</div>
    <div v-if="error" class="error-message">피치 정보를 불러오는 데 오류가 발생했습니다: {{ error.message }}</div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
// Firestore 관련 함수들은 샘플 데이터 로딩 시 사용되지 않지만 나중에 필요하므로 남겨둡니다.
// ESLint 오류를 피하기 위해 주석을 유지합니다.
// eslint-disable-next-line no-unused-vars, no-undef
import { collection as firestoreCollection, query as firestoreQuery, getDocs as firestoreGetDocs, orderBy } from 'firebase/firestore';
// eslint-disable-next-line no-unused-vars
import { db } from '@/firebase';


// eslint-disable-next-line no-undef
const props = defineProps({
  routeId: {
    type: String,
    required: true
  },
  pitchId: {
    type: String,
    required: true
  }
});

const router = useRouter();

const allPitches = ref([]); // 해당 라우트의 모든 피치 목록
const selectedPitchId = ref(null); // 현재 화면에 상세 정보를 표시할 피치의 ID

const loading = ref(true); // 로딩 상태
const error = ref(null); // 오류 상태

// allPitches 목록과 selectedPitchId에 따라 현재 표시할 피치 상세 정보를 계산하는 computed 속성
const currentPitchDetails = computed(() => {
    const foundPitch = allPitches.value.find(pitch => pitch.id === selectedPitchId.value);
    console.log(`[PitchDetailView] computed - 현재 선택된 피치 ID: ${selectedPitchId.value}, 찾은 피치:`, foundPitch);
    return foundPitch;
});


// ✅✅✅ 샘플 피치 데이터 정의 ✅✅✅
const samplePitches = [
  { id: 'pitch-1', number: 1, name: '1피치', length: '20m', difficulty: '5.8', climbingStyle: '슬랩', bolts: 3 },
  { id: 'pitch-2', number: 2, name: '2피치', length: '25m', difficulty: '5.9', climbingStyle: '크랙', bolts: 4 },
  { id: 'pitch-3', number: 3, name: '3피치', length: '30m', difficulty: '5.10a', climbingStyle: '페이스', bolts: 5 },
  { id: 'pitch-4', number: 4, name: '4피치', length: '27m', difficulty: '5.10b', climbingStyle: '오버행', bolts: 4 },
];

// ✅✅✅ 샘플 피치 데이터를 로드하는 함수 ✅✅✅
const loadSamplePitchData = () => {
    console.log("[PitchDetailView] 샘플 피치 데이터 로딩.");
    loading.value = true;
    error.value = null;

    // 실제 비동기 로딩처럼 보이도록 setTimeout 사용
    setTimeout(() => {
        allPitches.value = samplePitches; // 모든 샘플 피치 목록 할당

        // URL에서 받은 초기 pitchId를 바탕으로 선택된 피치를 설정
        const initialPitchId = props.pitchId;
        if (allPitches.value.find(p => p.id === initialPitchId)) {
            selectedPitchId.value = initialPitchId;
            console.log(`[PitchDetailView] 초기 선택된 피치 ID (샘플): ${selectedPitchId.value}`);
        } else if (allPitches.value.length > 0) {
            // 초기 ID가 샘플 데이터에 없거나 유효하지 않으면 첫 번째 피치 선택
            selectedPitchId.value = allPitches.value[0].id;
            console.warn(`[PitchDetailView] 초기 피치 ID "${initialPitchId}"를 찾을 수 없어 첫 번째 샘플 피치 "${selectedPitchId.value}"를 선택합니다.`);
            // URL의 pitchId를 첫 번째 피치 ID로 업데이트 (페이지 이동 없음)
             router.replace({ params: { routeId: props.routeId, pitchId: selectedPitchId.value } });
        }

        loading.value = false;
         console.log("[PitchDetailView] 샘플 피치 데이터 로딩 완료.");
    }, 300); // 로딩 지연 시간 (예시)
};


// fetchAllPitchesForRoute 함수는 나중에 실제 Firestore 사용 시 필요하므로 남겨둡니다.
// eslint-disable-next-line no-unused-vars
const fetchAllPitchesForRoute = async (routeId) => {
    // 이 함수는 실제 Firestore 조회를 수행합니다.
    console.log(`[PitchDetailView] 라우트 "${routeId}"의 모든 피치 목록 Firestore에서 가져오기 시작.`);
    loading.value = true;
    error.value = null;
    allPitches.value = [];

    // 실제 Firestore 경로 및 필드 (여러분의 데이터 구조에 맞게 수정!)
    const pitchesCollectionRef = firestoreCollection(db, 'routes', routeId, 'pitches');
    try {
        const q = firestoreQuery(pitchesCollectionRef, orderBy('number', 'asc'));
        const querySnapshot = await firestoreGetDocs(q);

        const pitchesList = [];
        querySnapshot.forEach(doc => {
            pitchesList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        allPitches.value = pitchesList;
        console.log(`[PitchDetailView] 라우트 "${routeId}"의 모든 피치 ${pitchesList.length}개 가져옴:`, allPitches.value);

        if (allPitches.value.find(p => p.id === props.pitchId)) {
             selectedPitchId.value = props.pitchId;
             console.log(`[PitchDetailView] 초기 선택된 피치 ID: ${selectedPitchId.value}`);
        } else if (allPitches.value.length > 0) {
            selectedPitchId.value = allPitches.value[0].id;
            console.warn(`[PitchDetailView] 초기 피치 ID "${props.pitchId}"를 찾을 수 없어 첫 번째 피치 "${selectedPitchId.value}"를 선택합니다.`);
             router.replace({ params: { routeId: props.routeId, pitchId: selectedPitchId.value } });
        }

    } catch (e) {
        console.error(`[PitchDetailView] 라우트 "${routeId}"의 모든 피치 목록 Firestore에서 가져오기 오류:`, e);
        error.value = e;
    } finally {
        loading.value = false;
         console.log("[PitchDetailView] Firestore 피치 로딩 완료.");
    }
};


// 피치 선택 버튼 클릭 시 호출될 함수
const selectPitch = (pitchId) => {
    if (selectedPitchId.value === pitchId) {
        console.log(`[PitchDetailView] 피치 "${pitchId}" 이미 선택됨.`);
        return;
    }
    if (allPitches.value.find(p => p.id === pitchId)) {
        console.log(`[PitchDetailView] 피치 "${pitchId}" 선택.`);
        selectedPitchId.value = pitchId;
        // URL의 pitchId를 선택된 피치 ID로 업데이트 (페이지 이동 없음)
        router.replace({ params: { routeId: props.routeId, pitchId: pitchId } });
    } else {
        console.warn(`[PitchDetailView] 피치 목록에 없는 피치 ID "${pitchId}" 선택 시도.`);
    }

};


// 뒤로가기 함수
const goBack = () => {
    console.log("[PitchDetailView] 뒤로가기 버튼 클릭.");
    router.go(-1);
};


// 컴포넌트 마운트 시 샘플 데이터를 로드합니다.
onMounted(() => {
  const { routeId, pitchId } = props;
   console.log(`[PitchDetailView] 마운트됨. 라우트 ID: ${routeId}, 초기 피치 ID: ${pitchId}. 샘플 데이터 로딩 시작.`);
  if (routeId && pitchId) { // 라우트 ID와 피치 ID가 모두 있을 때 샘플 데이터 로드 시도
    // fetchAllPitchesForRoute(routeId); // ✅ 실제 Firestore 조회는 주석 처리
    loadSamplePitchData(); // ✅ 샘플 데이터 로딩 함수 호출
  } else {
    console.error("[PitchDetailView] 라우트 ID 또는 초기 피치 ID가 제공되지 않았습니다.");
     loading.value = false;
  }
});
</script>


<style scoped>
.container > div{width: 100%;}


.page-title {
    text-align: center;
    font-size: 1.5em;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee; /* 하단 구분선 */
    padding-bottom: 10px;
}

.pitch-diagram-section {
    text-align: center;
    margin-bottom: 20px;
}

.route-diagram-img { /* Main diagram image */
  width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.pitch-info-section {
    margin-top: 20px;
}

.info-row {
    display: flex; /* 아이템들을 가로로 */
    justify-content: space-between; /* 아이템 사이 공간 균등 분배 */
    margin-bottom: 10px;
    /*flex-wrap: wrap; /* 공간 부족 시 줄바꿈 */
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

.info-item.full-width { /* 볼트 개수처럼 한 줄 전체 사용하는 경우 */
    width: 100%;
}


.info-item .fas { /* Font Awesome icon */
    margin-right: 10px;
    flex-shrink: 0; /* 아이콘 크기 고정 */
    color: #007bff; /* 아이콘 색상 (예시) */
}

.info-item span {
    flex-grow: 1;
    word-break: break-word; /* 긴 텍스트 줄바꿈 */
}


/* 이전의 .icon 클래스 스타일은 더 이상 필요 없거나 조정 필요 */

</style>