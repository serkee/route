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
  mounted() {
    this.initMap();
    this.setMarker(this.mapCenter, "ce");
    this.setMarker(this.bands, "1");
    this.setMarker(this.bands2, "2");
  },
  methods: {
    initMap() {
      this.map = new google.maps.Map(document.getElementById("map"), {
        //getElementById로 map id 속성의 요소를 가져온다.
        center: this.mapCenter, //center로 할 위도, 경도를 지정한다.
        zoom: 17, //zoom size를 지정.
        maxZoom: 20,
        minZoom: 3,
        streetViewControl: false, // 스트리트 뷰 펭귄맨 제거
        mapTypeControl: false, // 지도/위성 버튼 유지 여부 (필요에 따라 false)
        fullscreenControl: false, // 전체 화면 컨트롤 제거 (fuulscreenControl 오타 수정)
        zoomControl: false, // 확대/축소 버튼 유지 여부 (필요에 따라 false)
      });
    },
    setMarker(Points, Label) {
      //지도에 마커를 찍는 함수.
      const marker = new google.maps.Marker({
        // 변수 이름은 markers 대신 marker (단수)가 더 적절합니다.
        position: Points,
        map: this.map,
        label: {
          text: Label,
          color: "#FFF",
        },
      });
      this.markers.push(marker); // 생성된 마커를 배열에 추가
    },
  },
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
      markers: [], // 마커 객체들을 저장할 배열 추가
    };
  },
};
</script>


<style scoped>
.container {
  display: flex;
  flex-direction: column;
  /* 부모 컨테이너 (예: App.vue의 .main-content)가 전체 높이를 관리한다고 가정 */
  height: 100%;
  overflow: hidden; /* 컨테이너 넘침 방지 */
  padding: 50px 0 0px;
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
  flex-shrink: 0; /* 헤더가 줄어들지 않도록 함 */
}

/* 지도를 표시할 영역 스타일 */
#map {
  /* 또는 .map */
  flex-grow: 1; /* 남은 공간 전체를 맵이 차지하도록 함 */
  width: 100%;
  height: 100%; /* flex 컨테이너 안에서 높이 채움 */
  position: relative; /* 필요하다면 내부 요소 절대 위치 지정을 위해 유지 */
}

/* 기타 스타일 */
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