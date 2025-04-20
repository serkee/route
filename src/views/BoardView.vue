<template>
  <div class="container">
    <AppHeader />
    <div class="content">
      <div class="tab">
        <ul>
          <li class="active"><button>자유게시판</button></li>
          <li><button>루트</button><span class="new">N</span></li>
          <li><button>중고마켓</button></li>
        </ul>
      </div>
      <div class="list">
        <ul>
          <li>
            <a href="javascript:void(0)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다 피아노 안다닌 친구들 후기 궁금합니다 </p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다 피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="">
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="">
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="">
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="">
              </div>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <div class="txt">
                <p>피아노 안다닌 친구들 후기 궁금합니다</p>
                <ul>
                  <li>조회 <span>1,120</span></li>
                  <li><i class="rep"></i> <span>12</span></li>
                </ul>
              </div>
              <div class="img">
                <img src="@/assets/images/contents/@thumb.png" alt="">
              </div>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import (경로 확인)
</script>
  
<style scoped>
  .content{width: 100%; position: relative; padding-top: 70px;}
  .tab{position: fixed; left:20px; right:20px; top: 50px; z-index: 2;}
  .tab > ul{display: flex; background: #fff; padding-top: 30px; gap: 10px;}
  .tab > ul > li{flex: 1; position: relative;}
  .tab > ul > li .new{position: absolute; right: -3px; top: -3px; width: 20px; height: 20px; line-height:20px;background: rgb(216, 0, 0); color: #fff; display: block; border-radius: 100%; font-size: 12px; font-weight: bold;}
  .tab > ul > li > button{height: 40px; line-height: 41px; font-size: 18px; border:0; border: 1px solid rgb(223, 223, 223); background: transparent; width: 100%; padding: 0; cursor: pointer; border-radius: 20px; cursor: pointer;}
  .tab > ul > li.active > button{font-weight: bold; color: rgb(21, 115, 238); background: rgb(225, 241, 255);}
  .list{}
  .list > ul{}
  .list > ul > li{position: relative; border-bottom: 1px solid #e1e1e1;}
  .list > ul > li > a{text-align: left; display: flex; align-items: center; justify-content: space-between; padding: 20px 0; gap: 10px; text-decoration: none; color: #222;}
  .list > ul > li > a .txt{flex:1;}
  .list > ul > li > a .txt > p{text-overflow: hidden;}
  .list > ul > li > a .img{overflow:hidden; border-radius: 5px; font-size: 0; width: 100px;}
  .list > ul > li > a img{width: 100%;}
</style>