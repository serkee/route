<template>
  <div class="container">
    <div class="header">
      <div class="header__search">
        <div class="header__search-input">
          <input type="text" />
          <button></button>
        </div>
      </div>
    </div>
    <div ref="mapContainer" class="map"></div> </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"; // onMounted, onUnmounted, ref import

const mapContainer = ref(null); // 맵 컨테이너 엘리먼트를 참조할 ref
let mapInstance = null; // 맵 인스턴스를 저장할 변수

// 중요: 여기에 실제 카카오맵스 JavaScript API 키를 넣어주세요.
const KAKAO_MAPS_API_KEY = '4d113368cbe36c8eea18d20e1b9f95b0';

// 카카오맵스 스크립트를 동적으로 로드하는 함수
const loadKakaoMapsScript = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // 필요한 라이브러리 (services, clusterer 등)는 &libraries= 뒤에 콤마(,)로 구분하여 추가합니다.
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAPS_API_KEY}&libraries=services`;
    script.onload = () => resolve(); // 로드 성공 시 resolve
    script.onerror = () => reject(new Error('Failed to load Kakao Maps script')); // 로드 실패 시 reject
    document.head.appendChild(script); // head에 스크립트 추가
  });
};

// 카카오맵을 초기화하는 함수
const initMap = () => {
  // kakao.maps 객체와 맵 컨테이너 엘리먼트가 준비되었는지 확인
  if (!window.kakao || !window.kakao.maps || !mapContainer.value) {
    console.error("Kakao Maps API 또는 맵 컨테이너가 준비되지 않았습니다.");
    return;
  }

  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 지도의 중심좌표 (예: 서울 시청)
    level: 3 // 지도의 확대 레벨
  };

  // 맵 컨테이너와 옵션을 사용하여 맵 인스턴스 생성
  mapInstance = new kakao.maps.Map(mapContainer.value, options);
  console.log("카카오맵 초기화됨:", mapInstance);

  // 필요한 경우 여기에 마커, 오버레이 등 추가 로직 구현

  // 예시: 마커 추가
  // const markerPosition  = new kakao.maps.LatLng(37.5665, 126.9780);
  // const marker = new kakao.maps.Marker({
  //     position: markerPosition
  // });
  // marker.setMap(mapInstance);
};

// 카카오맵스 API가 로드될 때까지 기다리는 함수
const waitForKakaoMaps = (callback) => {
    if (window.kakao && window.kakao.maps) {
        callback(); // API가 준비되면 콜백 함수 실행
    } else {
        // 준비되지 않았다면 잠시 기다린 후 다시 시도
        setTimeout(() => waitForKakaoMaps(callback), 50);
    }
};


onMounted(async () => {
  console.log("MapView mounted");
  try {
    // 컴포넌트가 마운트되면 카카오맵스 스크립트 로드
    await loadKakaoMapsScript();
    console.log("카카오맵스 스크립트 로드 완료.");

    // 스크립트 로드 완료 후 API가 준비될 때까지 기다렸다가 맵 초기화
    waitForKakaoMaps(initMap);

  } catch (error) {
    console.error(error.message);
    // 스크립트 로드 실패 시 사용자에게 알림 등 오류 처리
  }
});

onUnmounted(() => {
    // 컴포넌트가 언마운트될 때 맵 리소스 정리
    if (mapInstance) {
         console.log("MapView unmounted. 맵 인스턴스:", mapInstance);
        // 카카오맵스 자체에 명시적인 destroy 메소드는 없지만,
        // 맵 컨테이너 엘리먼트가 DOM에서 제거될 때 관련 리소스가 정리됩니다.
        // 복잡한 라이브러리(Clusterer, Drawing 등)를 사용한다면 해당 인스턴스의 destroy 메소드를 호출해야 할 수 있습니다.
         mapInstance = null; // 맵 인스턴스 참조 해제 (가비지 컬렉션 도움)
    }
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  /* 부모 컨테이너 (예: App.vue의 .main-content)가 전체 높이를 관리한다고 가정 */
  height: 100%;
}

/* 헤더 스타일 */
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0; /* 필요에 따라 패딩 조정 */
    border-bottom: 1px solid #eee;
    background-color: white;
    width: 100%;
    box-sizing: border-box;
    /* height: 60px; /* 예시 고정 높이 */
    flex-shrink: 0; /* 헤더가 줄어들지 않도록 함 */
}

/* 맵 컨테이너 스타일 */
.map {
  flex-grow: 1; /* 남은 공간 전체를 맵이 차지하도록 함 */
  /* 기존 absolute 포지셔닝 스타일 제거 */
  position: relative; /* 필요하다면 내부 요소 절대 위치 지정을 위해 유지 */
  height: 100%; /* flex 컨테이너 안에서 높이 채움 */
}

/* 기타 스타일 */
h1 {
  margin-bottom: 10px;
}

.header__search {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0 20px; /* 패딩 조정 */
}
.header__search-input {
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  flex: 1;
}
.header__search-input > input {
  height: 30px;
  border: 0;
  background: transparent;
  flex: 1;
  padding-left: 10px; /* 패딩 추가 */
  outline: none; /* 포커스 시 아웃라인 제거 */
}
.header__search-input > button {
  width: 30px;
  height: 30px;
  border: 0;
  background: url(@/assets/images/common/ico_search.svg) no-repeat center center;
  background-size: 20px auto;
  opacity: .6;
  cursor: pointer; /* 커서 포인터 추가 */
}
</style>