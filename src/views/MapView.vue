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
export default {
  data() {
    return {
      map: null,
      mapCenter: { lat: 35.105696, lng: 129.042857 },
      bands: {
        lat: 35.106187,
        lng: 129.042943,
      },
      bands2: {
        lat: 35.105556,
        lng: 129.04393,
      },
      isScriptLoaded: false // 스크립트 로딩 상태 추적
    };
  },
  mounted() {
    // 컴포넌트 마운트 시 Google Maps 스크립트 로딩 및 지도 초기화 시도
    // 이 시점에는 <div id="map"> 요소가 DOM에 존재합니다.

    if (window.google && window.google.maps) {
      // Google Maps 객체가 이미 존재하면 (스크립트가 이미 로딩되었으면) 바로 지도 초기화
      console.log("Google Maps script already loaded. Initializing map directly.");
      this.initMap();
    } else if (!this.isScriptLoaded) {
       // Google Maps 객체가 없으면 (스크립트가 로딩되지 않았으면) 스크립트 동적 로딩
       console.log("Google Maps script not loaded. Loading script.");
       this.loadGoogleMapsScript();
       this.isScriptLoaded = true; // 로딩 시작 상태 표시
    }
     // else: isScriptLoaded가 true인데 window.google이 없으면 로딩 중이거나 오류 상태일 수 있음
     // window.initMap = this.initMap; // <-- 이 코드는 이제 필요 없습니다.
  },
   // 컴포넌트가 DOM에서 제거될 때 (페이지 이동 등) 리소스 정리
  unmounted() {
    // 필요한 경우 지도 객체 또는 이벤트 리스너 정리
    if (this.map) {
        // google.maps.event.clearInstanceListeners(this.map); // 특정 리스너 제거 필요시
        // this.map = null; // 메모리 누수 방지를 위해 null 할당 (필요에 따라)
    }
     // window.initMap 전역 함수 할당 해제 코드는 이제 필요 없습니다.
     // if (window.initMap === this.initMap) {
     //     delete window.initMap;
     // }
  },
  methods: {
    // Google Maps SDK 스크립트를 동적으로 로드하는 함수
    loadGoogleMapsScript() {
       console.log("Adding Google Maps script tag.");
       const script = document.createElement('script');
       // ** 중요: &callback=initMap 파라미터를 제거합니다. **
       script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBgxcD24z8xplfsyBObemCNZH-olShcwyY&libraries=places`; // 필요한 라이브러리 추가 가능
       script.async = true;
       script.defer = true;

       // ** 중요: 스크립트 로딩이 완료되면 이 콜백 함수가 실행됩니다. **
       script.onload = () => {
           console.log("Google Maps script loaded. Checking for google.maps availability.");
           if (window.google && window.google.maps) {
                console.log("google.maps is available. Initializing map from onload.");
                this.initMap(); // 스크립트 로딩 완료 후 컴포넌트의 initMap 호출
           } else {
                console.error("Google Maps script loaded, but google.maps object not available.");
                // 추가적인 오류 처리 로직
           }
       };

       // 스크립트 로딩 실패 시 대체 로직 (선택 사항)
       script.onerror = () => {
           console.error("Failed to load Google Maps script.");
           // 사용자에게 알림 또는 대체 콘텐츠 표시
       };

       document.head.appendChild(script);
    },
    // 이 initMap 함수는 스크립트 로딩 완료 후 컴포넌트 코드에 의해 호출됩니다.
    // 더 이상 Google Maps API가 직접 호출하지 않습니다.
    initMap() {
      console.log("initMap 함수 실행 시작.");
      const container = document.getElementById("map");

      // 컨테이너 요소가 유효한지 다시 한 번 확인 (SPA 환경에서 중요)
      if (!container) {
          console.error("Map container element #map not found.");
          return;
      }
       console.log("Map container found. Initializing google.maps.Map.");

      const options = {
        center: new window.google.maps.LatLng( // window.google.maps 명시
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
         this.map = new window.google.maps.Map(container, options); // window.google.maps 명시
         console.log("Google Map initialized successfully.", this.map);

         // 지도 크기 조정 이벤트 발생 (초기 렌더링 문제 해결에 도움될 수 있음)
         if(window.google && window.google.maps && window.google.maps.event) { // 이벤트 객체 사용 가능 여부 확인
             window.google.maps.event.addListenerOnce(this.map, 'idle', () => {
                  console.log("Map idle. Triggering resize.");
                  window.google.maps.event.trigger(this.map, 'resize'); // window.google.maps 명시
                  this.map.setCenter(new window.google.maps.LatLng(this.mapCenter.lat, this.mapCenter.lng)); // window.google.maps 명시
                  console.log("Map resize triggered and center reset.");
             });
         }


         // 지도가 생성된 후 마커를 설정합니다.
         this.setMarker(this.mapCenter, "ce");
         this.setMarker(this.bands, "1");
         this.setMarker(this.bands2, "2");

      } catch (error) {
          console.error("Error initializing Google Map:", error);
          // 지도 초기화 실패 시 사용자에게 알림 또는 대체 UI 표시
      }

    },
    setMarker(Points, Label) {
      if (this.map && window.google && window.google.maps && window.google.maps.Marker) { // Google Maps 객체 및 Marker 클래스 사용 가능 여부 확인
          // 변수 할당 없이 바로 마커 객체를 생성합니다.
          new window.google.maps.Marker({ // window.google.maps.Marker로 명시
            position: Points,
            map: this.map,
            label: {
              text: String(Label),
              color: "#FFF",
            },
          });
      } else {
          console.error("Cannot set marker: Map or Google Maps Marker class not available.");
      }
    },
  },
  // ... 나머지 데이터, 스타일 등
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