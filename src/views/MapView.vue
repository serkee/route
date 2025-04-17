<template>
    <div class="map-view">
      <h1>지도</h1>
      <div id="map-container">
        </div>
      </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue';
  
  onMounted(() => {
    console.log('MapView mounted');
  });
  </script>
  
  <style scoped>
  .map-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    width: 100%;
    height: 100%;
  }
  
  h1 {
    margin-bottom: 10px;
  }
  
  #map-container {
    width: 100%;
    height: 500px; /* 적절한 높이로 조절하세요 */
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  </style>