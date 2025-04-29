<template>
  <div class="container">
    <div class="header">
      <div class="header__search">
        <div class="header__search-input">
          <input type="text" />
          <button><i class="fas fa-magnifying-glass"></i></button>
        </div>
      </div>
    </div>
    <div id="map" class="map"></div>
      <div v-if="loading" class="loading-message">지도 데이터 로딩 중...</div>
      <div v-if="error" class="error-message">지도 데이터 로딩 오류: {{ error.message }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from 'vue-router';
import customMarkerIconUrl from '@/assets/images/contents/img_maker.png';

const router = useRouter();

const map = ref(null);
const routes = ref([]);
const loading = ref(true);
const error = ref(null);
const isScriptLoaded = ref(false);
const infoWindow = ref(null); // ✅ Infowindow 객체 참조 추가

// Google Maps SDK 스크립트를 동적으로 로드하는 함수
const loadGoogleMapsScript = () => {
    console.log("[MapView] Adding Google Maps script tag.");
    const script = document.createElement('script');
    // Infowindows require 'InfoWindow' class, which is part of the core API, no extra library needed for basic usage
    // callback=initMapCallback 파라미터를 추가하여 스크립트 로드 완료 후 initMapCallback 함수가 호출되도록 합니다.
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCZfe6QxKdK8qNsRjR9abSZC-Ysp7bnTmk&libraries=places&callback=initMapCallback`; // ✅✅✅ 실제 API 키로 교체하세요! ✅✅✅
    script.async = true;
    script.defer = true;

    // ✅ Google Maps 스크립트 로드 완료 후 호출될 콜백 함수 정의
    // 전역 스코프에 정의되어야 Google Maps API가 찾을 수 있습니다.
    window.initMapCallback = () => {
        console.log("[MapView] Google Maps script loaded and callback executed. Initializing map.");
        initMap(); // 스크립트 로드 완료 및 콜백 실행 후 지도 초기화
        isScriptLoaded.value = true; // 스크립트 로딩 완료 상태 표시
    };

    script.onerror = () => {
        console.error("[MapView] Failed to load Google Maps script.");
        error.value = new Error("Google Maps 스크립트 로딩에 실패했습니다.");
        loading.value = false;
    };

    document.head.appendChild(script);
    // isScriptLoaded.value = true; // 콜백 안으로 이동
};

// 지도 초기화 함수
const initMap = () => {
  console.log("[MapView] initMap 함수 실행 시작.");
  const container = document.getElementById("map");

  if (!container) {
      console.error("[MapView] Map container element #map not found.");
      error.value = new Error("#map 요소를 찾을 수 없습니다.");
      loading.value = false;
      return;
  }
  console.log("[MapView] Map container found. Initializing google.maps.Map.");

  // ✅✅✅ 지도 중심점 설정 (첫 번째 루트 또는 고정 위치) - routes.value 접근 ✅✅✅
  // fetchRoutes 함수가 이제 initMap 호출 *이후*에 실행되므로, 처음에는 routes.value가 비어있을 수 있습니다.
  // 기본 중심점을 먼저 설정하고, 루트 데이터를 가져온 후 첫 번째 루트 위치로 조정합니다.
  const initialCenter = new window.google.maps.LatLng(35.105696, 129.042857); // 루트가 없을 경우 기본 중심점

  const options = {
    center: initialCenter,
    zoom: 17,
    maxZoom: 20,
    minZoom: 3,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
    zoomControl: true,
  };

  try {
      map.value = new window.google.maps.Map(container, options); // map.value에 지도 객체 할당
      console.log("[MapView] Google Map initialized successfully.", map.value);

      // 지도가 완전히 로드되고 유휴 상태가 되면 크기 조정 및 중심점 설정 (필요하다면)
      if(window.google && window.google.maps && window.google.maps.event && map.value) { // map.value 확인 추가
          window.google.maps.event.addListenerOnce(map.value, 'idle', () => {
              console.log("[MapView] Map idle. Triggering resize.");
              window.google.maps.event.trigger(map.value, 'resize'); // 지도 크기 조정 이벤트 트리거
              // 루트 데이터 로드 후 중심점은 fetchRoutes에서 설정할 수 있습니다.
              console.log("[MapView] Map resize triggered.");
          });
      }

      // ✅✅✅ 지도가 생성된 후 Firestore에서 루트 데이터를 가져와 마커 설정 ✅✅✅
      fetchRoutes(); // 지도 초기화 성공 후 루트 데이터 가져오기 시작


  } catch (err) { // 오류 변수 이름 변경 (error 변수와 충돌 방지)
      console.error("[MapView] Error initializing Google Map:", err);
      error.value = err; // 오류 상태 업데이트
      loading.value = false; // 로딩 상태 해제
  }
};

 // ✅✅✅ Firestore에서 루트 목록을 가져오는 함수 ✅✅✅
const fetchRoutes = async () => { // 함수 정의
    console.log("[MapView] 루트 목록 가져오기 시작 (Firestore).");
    loading.value = true; // 로딩 시작
    error.value = null; // 오류 초기화
    try {
        const routesCollectionRef = collection(db, "routes"); // 'routes' 컬렉션 참조
        const q = query(routesCollectionRef); // 필요한 경우 정렬, 필터링 추가

        const querySnapshot = await getDocs(q); // 문서 목록 가져오기

        const routesList = [];
        querySnapshot.forEach(doc => {
            const routeData = doc.data();
            // 각 루트 문서에서 ID, 위치, 이름 등을 가져옵니다. (실제 필드명 확인)
            if (routeData.location && routeData.location.lat !== undefined && routeData.location.lng !== undefined) {
                routesList.push({
                    id: doc.id, // 루트 문서 ID
                    location: routeData.location, // 위치 ({lat, lng})
                    name: routeData.name || '이름 없음', // 루트 이름
                    // 필요한 다른 필드 추가
                });
            } else {
                console.warn(`[MapView] 루트 문서 ${doc.id}에 유효한 위치 정보가 없습니다. 마커를 생성하지 않습니다.`, routeData);
            }
        });
        routes.value = routesList; // 가져온 루트 목록 업데이트 (routes.value에 할당)
        console.log(`[MapView] 루트 ${routes.value.length}개 가져옴.`, routes.value);

        // ✅ 가져온 루트 목록으로 마커 생성 (Infowindow 포함)
        routes.value.forEach(route => { // routes.value 사용
            // setMarker 함수에 루트 위치, 루트 이름 (Infowindow에서 사용), 루트 ID 전달
            setMarker(route.location, route.name, route.id); // setMarker 함수 호출
        });

        // 루트 목록이 로드된 후 지도 중심점을 첫 번째 루트 위치로 업데이트 (선택 사항)
        if (routes.value.length > 0 && map.value && routes.value[0].location) {
             // 지도가 이미 초기화된 경우에만 중심점 이동
             if (map.value.setCenter) {
                map.value.setCenter(new window.google.maps.LatLng(routes.value[0].location.lat, routes.value[0].location.lng));
                console.log("[MapView] 지도 중심점 첫 번째 루트 위치로 업데이트.");
             }
        }


    } catch (err) { // 오류 변수 이름 변경
        console.error("[MapView] 루트 목록 가져오기 오류:", err);
        error.value = err; // 오류 상태 업데이트
    } finally {
        loading.value = false; // 로딩 완료
    }
};

// ✅✅✅ 마커 설정 함수 (Infowindow 사용하도록 수정) ✅✅✅
// 마커 클릭 시 Infowindow를 표시하고, Infowindow 안에 상세 페이지 링크를 넣습니다.
const setMarker = (location, label, routeId) => { // 함수 정의
  // Google Maps 관련 클래스가 로드되었는지 확인
  if (map.value && window.google && window.google.maps && window.google.maps.Marker && window.google.maps.InfoWindow) {
    const icon = {
        url: customMarkerIconUrl, // 임포트한 커스텀 이미지의 URL
        scaledSize: new window.google.maps.Size(38, 50),
      };
    const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(location.lat, location.lng), // 마커 위치
        map: map.value, // 마커를 표시할 지도 객체
        // ✅ 커스텀 마커 아이콘 설정 ✅
        icon: icon,
      });

      // ✅ Infowindow에 표시될 내용 (HTML 문자열)
      const infowindowContent = `
        <div style="font-size: 14px; padding: 5px;">
          <strong>${label || '이름 없음'}</strong><br>
          <a href="/routes/${routeId}" target="_blank" style="text-decoration: none; color: #007bff;">
            <i class="fas fa-link"></i> 상세 보기
          </a>
        </div>
      `;

      // ✅ 마커에 클릭 리스너 추가: 클릭 시 Infowindow 열기
      marker.addListener('click', () => {
        console.log(`[MapView] Navigating to route detail for ID: ${routeId}`);
        router.push({ name: 'routeDetail', params: { id: routeId } });
      });

  } else {
      console.error("[MapView] Cannot set marker: Map or Google Maps classes not available.");
  }
};

// ✅ 기존 handleMarkerClick 함수는 Infowindow 내 링크로 대체되었으므로 더 이상 필요 없습니다.
// 만약 Infowindow 내에서 특정 JS 함수를 호출하여 라우터 이동하는 복잡한 로직이 필요하다면 유지할 수 있지만,
// 단순 페이지 이동은 <a> 태그로 충분합니다.
// const handleMarkerClick = (routeId) => {
//     console.log(`[MapView] Navigating to route detail for ID: ${routeId}`);
//     // useRouter 훅으로 가져온 router 인스턴스 사용
//     router.push({ name: 'routeDetail', params: { id: routeId } });
// };


// ✅✅✅ 컴포넌트 마운트 시 실행될 로직 ✅✅✅
onMounted(() => {
  console.log("[MapView] Component mounted. Checking Google Maps script.");
  // Google Maps 스크립트 로드 및 initMapCallback 정의 여부를 확인하여 지도 초기화 로직 실행
  // callback 방식 사용 시, 스크립트 로딩 전에 initMap이 호출되지 않도록 주의합니다.
  if (window.google && window.google.maps && window.initMapCallback) {
     console.log("[MapView] Google Maps script already loaded and callback defined. Assuming map initialization is handled or will be shortly.");
     // 스크립트는 로드되었지만 어떤 이유로 initMap이 아직 호출되지 않았다면 여기에서 호출할 수 있습니다.
     // 하지만 callback 방식의 목적은 스크립트 로드 완료 시 initMap 호출을 보장하는 것입니다.
     // 따라서 일반적으로 이 else if 블록은 실행되지 않습니다.
     // if (!map.value) { initMap(); } // 안전을 위해 추가 가능하지만, callback 방식의 기본 흐름은 아닙니다.

  } else if (!isScriptLoaded.value) {
      console.log("[MapView] Google Maps script not loaded. Loading script.");
      loadGoogleMapsScript(); // Google Maps 스크립트 로드 시작
  } else {
      console.warn("[MapView] Google Maps script load initiated previously, but initMapCallback not yet available or script loading failed.");
       // 이 경우는 스크립트 로드 시도 후 에러가 발생했거나 콜백이 아직 준비되지 않은 상태일 수 있습니다.
  }
});

// ✅✅✅ 컴포넌트 언마운트 시 실행될 로직 ✅✅✅
onUnmounted(() => {
  console.log("[MapView] Component unmounted.");
  // 컴포넌트가 사라질 때 열려있는 Infowindow가 있다면 닫고 참조 해제
  if (infoWindow.value) {
    infoWindow.value.close();
    infoWindow.value = null;
  }
  // 지도 객체 및 이벤트 리스너 정리 (메모리 누수 방지 권장)
  if (map.value && window.google && window.google.maps && window.google.maps.event) {
      window.google.maps.event.clearInstanceListeners(map.value); // 지도 객체에 연결된 모든 리스너 해제
      // map.value = null; // 지도 객체 참조 해제 (가비지 컬렉션 대상이 되도록 도움)
  }
   // 동적으로 추가한 스크립트 태그 제거 (선택 사항)
   const script = document.querySelector(`script[src*="maps.googleapis.com"]`);
   if (script) {
       script.remove();
       console.log("[MapView] Removed Google Maps script tag.");
   }
   // 전역 콜백 함수 정의 해제 (메모리 정리)
   if (window.initMapCallback) {
       delete window.initMapCallback;
       console.log("[MapView] Undefined initMapCallback.");
   }
   isScriptLoaded.value = false; // 스크립트 로딩 상태 리셋
});


</script>

<style scoped>
/* 기존 스타일 유지 */
.container {
  padding: 50px 0 55px;
}
.header__search{
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}
.header__search-input {
    display: flex;
    gap: 5px;
    flex: 1;
}

.header__search-input input {
    flex-grow: 1;
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 18px;
}

.header__search-input button {
     /* 검색 버튼 스타일 */
    padding: 5px 9px;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 19px;
    cursor: pointer;
    font-size: 18px;
}

.map {
  flex-grow: 1; /* 남은 공간을 모두 차지 */
  width: 100%;
  height: 100%; /* flex-grow와 함께 부모 높이 기준 100% */
  background-color: #e0e0e0; /* 로딩 중 회색 배경 */
}

.loading-message, .error-message {
    position: absolute; /* 지도 위에 오버레이 */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10; /* 지도보다 위 */
    background-color: rgba(255, 255, 255, 0.8);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    text-align: center;
}

.error-message {
    color: red;
    background-color: rgba(255, 238, 238, 0.8);
}
</style>