<template>
    <div class="container">
      <div class="header">
        <div class="header__search">
          <div class="header__search-input">
            <input type="text" v-model="searchQuery" placeholder="루트명으로 검색하세요." @keyup.enter="performSearch" />
            <button @click="performSearch"><i class="fas fa-magnifying-glass"></i></button>
            <button @click="goAllList" class="list" title="모든 루트 보기"><i class="fas fa-bars"></i></button>
            
          </div>
        </div>
      </div>
  
      <div id="map" class="map"></div>
      <button class="btn-current-location" @click="moveToCurrentLocation" title="현재 위치로 이동">
        <i class="fas fa-location-arrow"></i> </button>
  
      <div v-if="loading" class="loading-message">지도 데이터 로딩 중...</div>
      <div v-if="error" class="error-message">지도 데이터 로딩 오류: {{ error.message }}</div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from "vue";
  import { collection, getDocs, query } from "firebase/firestore";
  import { db } from "@/firebase";
  import { useRouter } from 'vue-router';
  import { MarkerClusterer } from '@googlemaps/markerclusterer';
  
  import customMarkerIconUrl from '@/assets/images/contents/img_maker.png'; // 마커 이미지 임포트
  
  const router = useRouter();
  
  const map = ref(null);
  const routes = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const isScriptLoaded = ref(null); // 초기값 null 또는 false (mounted에서 true로 설정)
  
  const infoWindow = ref(null);
  
  const markerClusterer = ref(null);
  const markers = ref([]); // 개별 마커 객체들을 저장할 배열
  
  // ✅ 개별 마커를 표시할 최소 줌 레벨 임계값
  const INDIVIDUAL_MARKER_ZOOM_THRESHOLD = 15; // 이 줌 레벨부터 개별 마커 표시
  
  
  const searchQuery = ref('');
  
  // Google Maps SDK 스크립트를 동적으로 로드하는 함수
  const loadGoogleMapsScript = () => {
      console.log("[MapView] Adding Google Maps script tag.");
      const script = document.createElement('script');
      // ✅✅✅ 실제 유효한 Google Maps API 키로 교체하세요! ✅✅✅
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCZfe6QxKdK8qNsRjR9abSZC-Ysp7bnTmk&libraries=places&callback=initMapCallback`; // ⭐ API 키 교체 필요 ⭐
      script.async = true;
      script.defer = true;
  
      window.initMapCallback = () => {
          console.log("[MapView] Google Maps script loaded and callback executed. Initializing map.");
          initMap();
          isScriptLoaded.value = true;
      };
  
      script.onerror = () => {
          console.error("[MapView] Failed to load Google Maps script.");
          error.value = new Error("Google Maps 스크립트 로딩에 실패했습니다.");
          loading.value = false;
      };
  
      document.head.appendChild(script);
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
  
    const initialCenter = new window.google.maps.LatLng(35.105696, 129.042857); // 예시: 부산 시청 근처
  
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
        map.value = new window.google.maps.Map(container, options);
        console.log("[MapView] Google Map initialized successfully.", map.value);
  
        if(window.google && window.google.maps && window.google.maps.event && map.value) {
            // 지도가 완전히 로드되고 유휴 상태가 되면 초기 마커 상태 업데이트
            window.google.maps.event.addListenerOnce(map.value, 'idle', () => {
                console.log("[MapView] Map idle. Triggering resize.");
                window.google.maps.event.trigger(map.value, 'resize');
                // updateMapMarkers(); // 마커 로직을 fetchRoutes 완료 후 updateMapMarkers 호출로 옮김
            });
  
            // ✅ 지도의 줌 레벨 변경 이벤트 리스너 추가 (수동 관리 시 사용)
            // 마커 클러스터러의 자동 관리에 의존할 경우 이 리스너와 updateMapMarkers 로직을 제거합니다.
            map.value.addListener('zoom_changed', () => {
                const currentZoom = map.value.getZoom();
                console.log("[MapView] Map zoom changed. Current zoom:", currentZoom);
                // updateMapMarkers(); // 수동 마커 표시 관리 함수 호출
            });
             // ✅ 지도의 드래그 종료 이벤트 리스너 추가 (선택 사항: 필요하다면 드래그 후에도 업데이트)
             // map.value.addListener('dragend', () => {
             //     console.log("[MapView] Map drag ended.");
             //     // updateMapMarkers(); // 필요시 주석 해제
             // });
        }
  
        // 지도 초기화 성공 후 루트 데이터 가져오기
        // fetchRoutes 완료 후 마커 클러스터러가 지도에 추가됩니다.
        fetchRoutes();
  
    } catch (err) {
        console.error("[MapView] Error initializing Google Map:", err);
        error.value = err;
        loading.value = false;
    }
  };
  
  // Firestore에서 루트 목록을 가져와 마커 객체들만 생성
  const fetchRoutes = async () => {
      console.log("[MapView] 루트 목록 가져오기 시작 (Firestore).");
      loading.value = true;
      error.value = null;
  
      if (!map.value) {
          console.warn("[MapView] 지도 객체가 준비되지 않아 루트 데이터를 가져올 수 없습니다.");
          loading.value = false;
          return;
      }
  
      // 기존 마커 및 클러스터러 제거 (새 데이터로 대체)
      clearMarkersAndClusterer();
  
  
      try {
          const routesCollectionRef = collection(db, "routes");
          const q = query(routesCollectionRef);
  
          const routesList = []; // 모든 루트 데이터 저장용 (선택 사항)
          const newMarkers = []; // 새로 생성할 마커 객체들을 담을 배열
          const bounds = new window.google.maps.LatLngBounds(); // 모든 마커를 포함할 경계 영역
  
          const querySnapshot = await getDocs(q);
  
          querySnapshot.forEach(doc => {
              const routeData = doc.data();
              if (routeData.location && routeData.location.lat !== undefined && routeData.location.lng !== undefined) {
                  const route = {
                      id: doc.id,
                      location: routeData.location,
                      name: routeData.name || '이름 없음',
                      // 필요한 다른 필드 추가
                  };
                  routesList.push(route);
  
                   // 마커 객체 생성 (지도에 바로 추가하지 않음)
                   const marker = createMarker(route.location, route.name, route.id);
                   if (marker) { // createMarker가 null을 반환할 경우를 대비
                     newMarkers.push(marker); // 생성된 마커 객체를 배열에 추가
  
                     // 마커 경계 영역 확장
                     bounds.extend(new window.google.maps.LatLng(route.location.lat, route.location.lng));
                   }
  
  
              } else {
                  console.warn(`[MapView] 루트 문서 ${doc.id}에 유효한 위치 정보가 없습니다.`, routeData);
              }
          });
          routes.value = routesList; // 전체 루트 목록 업데이트
          markers.value = newMarkers; // 새로 생성된 마커 배열 업데이트
          console.log(`[MapView] 전체 루트 ${routes.value.length}개 가져옴. 마커 ${markers.value.length}개 생성.`);
  
          // ✅ Marker Clusterer 생성 및 마커 추가 (데이터 로드 완료 후)
          if (map.value && markers.value.length > 0) {
               createMarkerClusterer(map.value, markers.value); // 클러스터러 생성 및 마커 추가
               console.log("[MapView] Marker Clusterer 생성 및 마커 추가 완료.");
  
               // 가져온 루트 목록이 있을 경우, 지도 뷰를 모든 마커(클러스터 포함)를 포함하도록 조정
               console.log("[MapView] Adjusting map bounds to fit all routes.");
               map.value.fitBounds(bounds, { padding: 50 }); // 50px 패딩 적용 예시
               console.log("[MapView] Map bounds adjusted.");
  
          } else if (map.value) {
               // 루트가 없을 경우, 초기 설정된 중심점과 줌 레벨을 유지합니다.
              console.log("[MapView] No routes found to fit bounds. Keeping initial center/zoom.");
          }
           loading.value = false; // 데이터 로드 및 마커/클러스터링 완료 후 로딩 해제
  
  
      } catch (err) {
          console.error("[MapView] 루트 목록 가져오기 오류:", err);
          error.value = err;
          loading.value = false; // 오류 발생 시 로딩 해제
      }
  };
  
  // 마커 객체만 생성하는 함수 (지도에 바로 추가하지 않음)
  const createMarker = (location, label, routeId) => {
    if (window.google && window.google.maps && window.google.maps.Marker) {
        // 개별 마커 아이콘 (클러스터링 해제 시 표시될 아이콘)
        const icon = {
            url: customMarkerIconUrl, // 여러분이 사용하는 개별 마커 이미지
            scaledSize: new window.google.maps.Size(30, 40), // 아이콘 크기 조정
        };
        const marker = new window.google.maps.Marker({
            position: new window.google.maps.LatLng(location.lat, location.lng),
            // map: map.value, // ✅ 마커를 생성할 때 지도에 바로 추가하지 않습니다. 클러스터러가 관리
            icon: icon, // 개별 마커 아이콘 설정
            title: label,
        });
  
        // 마커 클릭 리스너 추가
        marker.addListener('click', () => {
            console.log(`[MapView] Marker clicked. Route ID: ${routeId}`);
            // 상세 페이지 이동
            router.push({ name: 'admin-route-detail', params: { id: routeId } });
        });
  
        return marker; // 생성된 마커 객체 반환
  
    } else {
        console.error("[MapView] Cannot create marker: Google Maps classes not available.");
        return null;
    }
  };
  
  // Marker Clusterer를 생성하고 마커 배열을 추가하는 함수
  const createMarkerClusterer = (mapInstance, markersArray) => {
      // 기존 클러스터러가 있다면 제거
      if (markerClusterer.value) {
          markerClusterer.value.clearMarkers();
          markerClusterer.value = null;
      }
  
      // Marker Clusterer 인스턴스 생성
      markerClusterer.value = new MarkerClusterer({
          markers: markersArray,
          map: mapInstance,
          // minimumClusterSize 옵션을 1로 설정하여 1개 마커도 클러스터로 처리
          minimumClusterSize: 1,
          // 필요에 따라 다른 옵션 추가 (예: grid, maxZoom 등)
          // grid: 60, // 클러스터링 그리드 크기 (픽셀 단위), 기본값은 60
          // maxZoom: 18, // 이 줌 레벨 이상에서는 클러스터링 비활성화 (개별 마커 표시)
          // 기본 클러스터 아이콘 스타일을 사용합니다.
          // 클러스터 디자인을 커스터마이징하려면 renderer 옵션을 사용해야 합니다.
          // renderer: { render: ({ count, position }, stats, map) => new google.maps.Marker({...}) }
      });
  
      console.log("[MapView] New Marker Clusterer created with minimumClusterSize: 1.");
  
      // TODO: 클러스터 마커의 디자인 및 클릭 이벤트 등을 커스터마이징 할 수 있습니다.
      // markerClusterer.addListener('click', (cluster) => { ... });
  };
  
  // 기존 마커와 클러스터러를 제거하는 함수
  const clearMarkersAndClusterer = () => {
       console.log("[MapView] Clearing existing markers and clusterer.");
       // 클러스터러 인스턴스가 있다면 관리하는 모든 마커를 지도에서 제거하고 클러스터러 자체를 해제
       if (markerClusterer.value) {
           markerClusterer.value.clearMarkers(); // 클러스터러에서 관리하는 모든 마커 제거 (지도에서 사라짐)
           markerClusterer.value = null; // 클러스터러 인스턴스 해제
           console.log("[MapView] Existing Clusterer cleared.");
       }
       // 개별 마커 객체들도 지도에서 제거하고 배열 초기화
       // 클러스터러가 마커를 관리할 때는 clearMarkers가 마커의 map=null을 설정합니다.
       // 수동 관리 시에는 직접 setMap(null) 해야 합니다.
       // 현재 코드는 클러스터러가 관리하므로, 이 부분은 클러스터러 인스턴스 해제 후 markers 배열만 비웁니다.
       if (markers.value && markers.value.length > 0) {
          // 클러스터러가 이미 setMap(null)을 해줬을 것이므로, 배열만 비웁니다.
           markers.value = []; // 마커 객체 배열 초기화 (메모리 관리)
           console.log("[MapView] Individual markers array cleared.");
       } else {
            console.log("[MapView] No individual markers to clear.");
       }
  
  };
  
  // ✅✅✅ 현재 위치로 이동하는 함수 ✅✅✅
  const moveToCurrentLocation = () => {
    console.log("[MapView] Attempting to move to current location.");
    // 지오로케이션 API 사용 가능 여부 확인
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 지오로케이션이 지원되지 않습니다.');
      console.warn("[MapView] Geolocation not supported.");
      return;
    }
  
    loading.value = true; // 위치 가져오는 동안 로딩 표시 (선택 사항)
  
    // 현재 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      (position) => { // 성공 콜백
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("[MapView] Successfully got current location:", currentLocation);
  
        if (map.value) {
          const googleLatLng = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);
  
          // 지도를 현재 위치로 이동
          map.value.setCenter(googleLatLng);
  
          // 적절한 줌 레벨 설정 (선택 사항)
          // 현재 줌 레벨이 너무 작으면 확대합니다.
          if (map.value.getZoom() < 14) { // 예: 줌 레벨 14보다 작으면
             map.value.setZoom(14); // 줌 레벨 14로 설정
             console.log("[MapView] Adjusted zoom level to 14.");
          }
  
          console.log("[MapView] Map centered to current location.");
        } else {
           console.warn("[MapView] Map not initialized when current location was received.");
        }
  
        loading.value = false; // 로딩 해제
  
      },
      (error) => { // 에러 콜백
        loading.value = false; // 로딩 해제
        console.error("[MapView] Geolocation error:", error);
  
        // 에러 종류에 따른 메시지 표시
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('현재 위치 정보 접근이 허용되지 않았습니다. 브라우저 설정에서 위치 정보 접근을 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('위치 정보를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
            break;
          case error.TIMEOUT:
            alert('위치 정보를 가져오는 요청 시간이 초과되었습니다.');
            break;
          default:
            alert('위치 정보를 가져오는데 알 수 없는 오류가 발생했습니다.');
            break;
        }
      },
      { // 옵션 (선택 사항)
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 5000, // 5초 타임아웃
        maximumAge: 0 // 캐시된 위치 사용 안 함
      }
    );
  };
  
  
  // 검색 실행 함수
  const performSearch = () => {
    console.log("[MapView] Performing search for:", searchQuery.value);
    const queryText = searchQuery.value.trim();
  
    if (!queryText) {
      console.log("[MapView] Search query is empty. No search performed.");
      return;
    }
  
    router.push({ name: 'mapSearch', query: { q: queryText } });
    console.log(`[MapView] Navigating to mapSearch page with query: ${queryText}`);
  };
  const goAllList = () => {
    console.log("[MapView] Navigating to show all routes page.");
    router.push({
        name: 'mapSearch', // 모든 루트 목록을 표시할 라우트 이름 (현재는 검색 결과 페이지 재활용)
        query: {
            show: 'all', // '모든 루트를 보여달라'는 의미의 쿼리 파라미터
            sort: 'name_asc' // '이름' 필드를 기준으로 '오름차순'(asc) 정렬하라는 쿼리 파라미터 (가나다 순)
        }
    });
     console.log("[MapView] Navigation to mapSearch with query {show: 'all', sort: 'name_asc'} completed.");
};
  // 컴포넌트 마운트 시 실행
  onMounted(() => {
   console.log("[MapView] Component mounted. Checking Google Maps script.");
    // isScriptLoaded.value가 null 또는 false일 때만 스크립트 로드
    // isScriptLoaded는 initMapCallback에서 true로 설정되므로, 초기 로드 시 null 체크
    if (isScriptLoaded.value === null || isScriptLoaded.value === false) {
        console.log("[MapView] Google Maps script not loaded. Loading script.");
        loadGoogleMapsScript(); // Google Maps 스크립트 로드 시작 (콜백에서 initMap 호출)
    } else {
         console.log("[MapView] Google Maps script already loaded. Initializing map directly.");
         // 스크립트가 이미 로드된 경우 initMap을 직접 호출 (새로고침 없이 페이지 이동 시 발생 가능)
         if (!map.value) {
              initMap(); // 지도 객체가 없다면 초기화
         } else {
              // 지도가 이미 초기화되어 있다면, 데이터만 다시 가져와 마커를 표시
              console.log("[MapView] Map already initialized. Fetching routes again for markers.");
              fetchRoutes(); // 데이터를 다시 가져와 마커/클러스터링 업데이트
         }
    }
  });
  
  // 컴포넌트 언마운트 시 실행
  onUnmounted(() => {
   console.log("[MapView] Component unmounted.");
   // 컴포넌트가 사라질 때 열려있는 Infowindow가 있다면 닫고 참조 해제
   if (infoWindow.value) {
    infoWindow.value.close();
    infoWindow.value = null;
   }
   // ✅ 컴포넌트 언마운트 시 마커 클러스터러 및 개별 마커 정리
   clearMarkersAndClusterer(); // 클러스터러와 마커 제거
  
   // 지도 객체 및 이벤트 리스너 정리 (메모리 누수 방지)
   if (map.value && window.google && window.google.maps && window.google.maps.event) {
     window.google.maps.event.clearInstanceListeners(map.value);
     // map.value = null; // 지도 객체 참조 해제는 신중하게 결정
   }
      console.log("[MapView] Component unmounted complete.");
  });
  
  
  </script>
  
  
  <style scoped>
  /* 기존 스타일 유지 */
  .container {
   padding: 40px 0 50px;
   display: flex; /* flexbox 컨테이너 */
   flex-direction: column; /* 세로 방향 정렬 */
   height: 100vh; /* 뷰포트 높이 전체 */
  }
  .header{
   /* 헤더는 고정 높이 또는 내용에 맞게 자동 높이 */
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
    max-width: 500px; /* 검색 입력창 최대 너비 제한 */
  }
  
  .header__search-input input {
    flex-grow: 1;
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 18px;
    font-size: 14px;
  }
  
  .header__search-input button {
    /* 검색 버튼 스타일 */
    /* padding: 5px 7px; */
    width:33px;
    height: 33px;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 19px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .header__search-input button.list{
    background: #222;
  }
  
  .map {
   flex-grow: 1; /* 남은 공간을 모두 차지하도록 설정 */
   width: 100%;
   /* height: 100%; */ /* flex-grow가 설정되면 height: 100%는 불필요하거나 다르게 작동할 수 있습니다. */
   background-color: #e0e0e0; /* 로딩 중 회색 배경 */
   position: relative; /* 현재 위치 버튼의 기준 */
  }
  
  /* ✅ 현재 위치로 이동 버튼 스타일 */
  .btn-current-location {
      position: absolute; /* 지도를 기준으로 절대 위치 */
      bottom: 173px;
      right: 10px;
      z-index: 5; /* 지도 컨트롤 위에 표시 */
      background-color: #fff; /* 흰색 배경 */
      border: 1px solid #ccc; /* 연한 테두리 */
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2); /* 그림자 */
      display: flex; /* 아이콘 가운데 정렬 */
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
  }
  
  .btn-current-location i {
      font-size: 18px; /* 아이콘 크기 */
      color: #333; /* 아이콘 색상 */
  }
  
  .btn-current-location:hover {
      background-color: #f0f0f0; /* 호버 시 배경색 변경 */
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