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
    <div id="map" class="map"></div>
  </div>
</template>

<script>
// Vue Router 사용을 위해 필요합니다. (Options API에서는 this.$router로 접근 가능)
// import { useRouter } from 'vue-router'; // setup script에서 사용

export default {
  data() {
    return {
      map: null,
      // 예시로 사용할 마커 위치 데이터. 실제 애플리케이션에서는 데이터베이스 등에서 불러올 것입니다.
      // 각 위치에 고유 ID를 추가했습니다.
      mapCenter: { lat: 35.105696, lng: 129.042857, id: 'route-ce', label: 'ce' },
      bands: { lat: 35.106187, lng: 129.042943, id: 'route-bands', label: '1' },
      bands2: { lat: 35.105556, lng: 129.04393, id: 'route-bands2', label: '2' },
      isScriptLoaded: false // 스크립트 로딩 상태 추적
    };
  },
  mounted() {
    // 컴포넌트 마운트 시 Google Maps 스크립트 로딩 및 지도 초기화 시도
    if (window.google && window.google.maps) {
      console.log("Google Maps script already loaded. Initializing map directly.");
      this.initMap();
    } else if (!this.isScriptLoaded) {
        console.log("Google Maps script not loaded. Loading script.");
        this.loadGoogleMapsScript();
        this.isScriptLoaded = true; // 로딩 시작 상태 표시
    }
  },
  unmounted() {
    // 컴포넌트가 DOM에서 제거될 때 리소스 정리
    if (this.map) {
        // 필요에 따라 지도 객체 또는 이벤트 리스너 정리
    }
  },
  methods: {
    // Google Maps SDK 스크립트를 동적으로 로드하는 함수
    loadGoogleMapsScript() {
        console.log("Adding Google Maps script tag.");
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBgxcD24z8xplfsyBObemCNZH-olShcwyY&libraries=places`; // API 키 및 필요한 라이브러리 (places 등)
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log("Google Maps script loaded. Checking for google.maps availability.");
            if (window.google && window.google.maps) {
                console.log("google.maps is available. Initializing map from onload.");
                this.initMap(); // 스크립트 로딩 완료 후 컴포넌트의 initMap 호출
            } else {
                console.error("Google Maps script loaded, but google.maps object not available.");
            }
        };

        script.onerror = () => {
            console.error("Failed to load Google Maps script.");
        };

        document.head.appendChild(script);
    },
    // 지도 초기화 함수
    initMap() {
      console.log("initMap 함수 실행 시작.");
      const container = document.getElementById("map");

      if (!container) {
          console.error("Map container element #map not found.");
          return;
      }
        console.log("Map container found. Initializing google.maps.Map.");

      const options = {
        center: new window.google.maps.LatLng(
          this.mapCenter.lat,
          this.mapCenter.lng
        ),
        zoom: 17,
        maxZoom: 20,
        minZoom: 3,
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: false,
        zoomControl: true,
      };

      try {
          this.map = new window.google.maps.Map(container, options);
          console.log("Google Map initialized successfully.", this.map);

          // 지도 크기 조정 이벤트 발생 (초기 렌더링 문제 해결에 도움될 수 있음)
          if(window.google && window.google.maps && window.google.maps.event) {
              window.google.maps.event.addListenerOnce(this.map, 'idle', () => {
                  console.log("Map idle. Triggering resize.");
                  window.google.maps.event.trigger(this.map, 'resize');
                  this.map.setCenter(new window.google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng));
                  console.log("Map resize triggered and center reset.");
              });
          }

          // ✅✅✅ 지도가 생성된 후 마커를 설정합니다. 각 마커에 ID를 함께 전달합니다. ✅✅✅
          this.setMarker(this.mapCenter, this.mapCenter.label, this.mapCenter.id);
          this.setMarker(this.bands, this.bands.label, this.bands.id);
          this.setMarker(this.bands2, this.bands2.label, this.bands2.id);

      } catch (error) {
          console.error("Error initializing Google Map:", error);
      }
    },
    // ✅✅✅ 마커 설정 함수 수정 - routeId 인자 추가 및 클릭 리스너 추가 ✅✅✅
    setMarker(Points, Label, routeId) {
      if (this.map && window.google && window.google.maps && window.google.maps.Marker) {
          const marker = new window.google.maps.Marker({
            position: new window.google.maps.LatLng(Points.lat, Points.lng), // Points 객체에서 lat, lng 사용
            map: this.map,
            label: {
              text: String(Label),
              color: "#FFF",
            },
            // ZIndex 등 추가 옵션 가능
          });

          // ✅ 마커에 클릭 리스너 추가
          window.google.maps.event.addListener(marker, 'click', () => {
              console.log(`Marker clicked! Label: ${Label}, Route ID: ${routeId}`);
              this.handleMarkerClick(routeId); // 클릭 시 handleMarkerClick 함수 호출
          });

          // 필요한 경우 마커 객체를 저장하여 나중에 관리 (예: this.markers.push(marker);)
      } else {
          console.error("Cannot set marker: Map or Google Maps Marker class not available.");
      }
    },
    // ✅✅✅ 마커 클릭 시 상세 페이지로 이동하는 함수 추가 ✅✅✅
    handleMarkerClick(routeId) {
        console.log(`Navigating to route detail for ID: ${routeId}`);
        // Vue Router를 사용하여 '/route/:id' 형태의 라우트로 이동합니다.
        // 'routeDetail'은 router/index.js에서 정의할 라우트 이름입니다.
        this.$router.push({ name: 'routeDetail', params: { id: routeId } });
        // 또는 경로로 직접 이동: this.$router.push(`/route/${routeId}`);
    }
  },
};
</script>

<style scoped>
/* 기존 스타일 유지 */
.container {
  padding: 50px 0 0;
}

.header {
  flex-shrink: 0; /* 헤더 고정 */
  /* ... 기존 헤더 스타일 */
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 10px 0;
   border-bottom: 1px solid #eee;
   background-color: white;
   width: 100%;
   box-sizing: border-box;
}

#map {
  flex-grow: 1; /* 남은 공간 전체를 지도가 차지 */
  width: 100%;
  /* height: 100%; /* flex-grow 때문에 필요 없을 수 있지만 안전하게 유지 */
  position: relative;
}

/* ... 기타 스타일 (header__search 등) */
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
  opacity: 0.6;
  cursor: pointer; /* 커서 포인터 추가 */
}
</style>