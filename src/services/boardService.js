
    // src/services/boardService.js
    
    // 필요한 Firebase SDK 함수들을 import 합니다.
    import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, deleteDoc,
     serverTimestamp, runTransaction, where,
    } from 'firebase/firestore'; // Firestore 함수 import
    import { getAuth } from 'firebase/auth'; // getAuth 함수 import
    import { ref as storageRef, deleteObject } from 'firebase/storage'; // Storage 함수 import
    
    // Firestore 업데이트 관련 함수 import
    import { updateDoc } from 'firebase/firestore'; // increment는 조회수 증가에 사용됩니다.
    
    // @/firebase 에서 db, storage 인스턴스 import
    import { db, storage } from '@/firebase'; // db, storage 인스턴스 import
    
    
    // 게시글 목록을 가져오는 함수 (BoardView.vue에서 사용)
    const getPosts = async (collectionName, category) => {
      console.log(`[boardService] getPosts 시작: 컬렉션 ${collectionName}, 카테고리 ${category}`);
      try {
        const postsCollectionRef = collection(db, collectionName);
        const q = query(
          postsCollectionRef,
          where('category', '==', category), // 카테고리로 필터링
          orderBy('createdAt', 'desc') // 최신 글순 정렬
        );
        const querySnapshot = await getDocs(q);
        const postsList = [];
        querySnapshot.forEach((doc) => {
          postsList.push({ id: doc.id, ...doc.data() });
        });
        console.log(`[boardService] getPosts 성공. ${postsList.length}개 게시글 로드.`);
        return postsList;
      } catch (error) {
        console.error("[boardService] 게시글 목록 가져오기 오류:", error);
        throw error;
      }
    };
    
    
    // 게시글 상세 정보를 가져오는 함수 (BoardDetailView.vue에서 사용)
    const getPostById = async (postId) => {
      console.log(`[boardService] getPostById 시작. postId: ${postId}`);
      if (!postId) {
        console.error("[boardService] getPostById: 게시글 ID가 없습니다.");
        return null;
      }
      try {
        // 'posts' 컬렉션에서 해당 ID의 문서 참조 가져오기
        const postDocRef = doc(db, 'posts', postId);
        // 문서 데이터 가져오기
        const postSnapshot = await getDoc(postDocRef);
    
        if (postSnapshot.exists()) {
          const postData = { id: postSnapshot.id, ...postSnapshot.data() };
          console.log(`[boardService] getPostById 성공. 게시글 데이터:`, postData);
          return postData;
        } else {
          // 해당 ID의 문서가 없는 경우
          console.warn(`[boardService] getPostById: 게시글 ${postId}를 찾을 수 없습니다.`);
          return null;
        }
      } catch (error) {
        console.error(`[boardService] 게시글 ${postId} 상세 정보 가져오기 오류:`, error);
        throw error;
      }
    };
    
    
    // 게시글을 Firestore에 추가하는 함수 (BoardWriteView.vue에서 호출)
    // postData 인자는 { category, title, content, imageUrl 등 } 포함
    const createPost = async (postData) => {
     console.log(">>> DEBUG: Using the latest createPost function <<<");
     console.log("[boardService] createPost 시작. postData:", postData);
    
    
      try {
        const auth = getAuth();
        const user = auth.currentUser; // 현재 로그인 사용자 정보 가져오기
    
        if (!user) {
          // 로그인하지 않은 사용자는 게시글 작성 불가
          console.error("[boardService] 게시글 작성: 사용자 로그인되지 않음.");
          throw new Error("게시글 작성은 로그인 후 가능합니다.");
        }
        console.log("[boardService] 게시글 작성 사용자:", user.uid, "DisplayName:", user.displayName);
    
    
        // Firestore에 저장할 게시글 데이터 객체 생성
        const newPostData = {
          ...postData, // 전달받은 게시글 데이터 (category, title, content, imageUrl 등)
          authorId: user.uid, // 작성자 UID
          // authorEmail: user.email, // 필요하다면 이메일도 저장
          authorName: user.displayName || user.email || '익명', // <-- 작성자 닉네임(displayName) 저장 (없으면 이메일 또는 '익명')
          createdAt: serverTimestamp(), // 서버 타임스탬프
          views: 0, // 초기 조회수
          commentCount: 0, // 초기 댓글 수
          // ... 필요한 다른 필드 ...
        };
    
        // *** 디버깅을 위해 이 객체가 Firestore에 저장되기 전에 콘솔에 출력해봅니다. ***
        console.log("[boardService] Firestore에 저장될 최종 게시글 데이터:", newPostData);
    
    
        // 'posts' 컬렉션 참조
        const postsCollectionRef = collection(db, 'posts');
    
        // Firestore에 새 문서 추가
        console.log("[boardService] 게시글 문서 addDoc 시도");
        const docRef = await addDoc(postsCollectionRef, newPostData);
        console.log(`[boardService] 게시글 문서 addDoc 성공. 문서 ID: ${docRef.id}`);
    
        return docRef.id; // 생성된 게시글 문서 ID 반환
    
      } catch (error) {
        console.error("[boardService] 게시글 작성 오류:", error);
        // 오류를 호출한 곳으로 다시 던져서 처리 (BoardWriteView.vue)
        throw error;
      }
    };
    
    // 게시글 업데이트 함수 (BoardWriteView.vue 수정 모드에서 사용)
    // postId: 업데이트할 게시글 ID
    // updatedData: { category?, title?, content?, imageUrl? } 등 수정된 필드 포함
    // oldImageUrl: 수정 전 게시글의 이미지 URL (Storage 이미지 삭제 필요 시 사용)
    const updatePost = async (postId, updatedData, oldImageUrl) => {
      console.log(`[boardService] updatePost 시작. postId: ${postId}, updatedData:`, updatedData, `oldImageUrl:`, oldImageUrl);
      if (!postId) {
        console.error("[boardService] updatePost: 게시글 ID가 없습니다.");
        throw new Error("게시글 ID가 없어 업데이트할 수 없습니다.");
      }
    
      // 현재 로그인 사용자 확인 (권한 확인은 BoardDetailView에서 이미 했지만 여기서도 가능)
      // const auth = getAuth();
      // const user = auth.currentUser;
      // if (!user) { /* ... throw error ... */ }
      // TODO: 업데이트 시 작성자 일치 확인 로직 추가 필요 (보안 규칙으로도 가능)
    
    
      const postRef = doc(db, 'posts', postId);
    
      try {
        // 1. Firestore 문서 업데이트
        console.log(`[boardService] 게시글 ${postId} 문서 updateDoc 시도. 데이터:`, updatedData);
        // updateDoc 함수는 updatedData에 포함된 필드만 업데이트합니다.
        await updateDoc(postRef, updatedData);
        console.log(`[boardService] 게시글 ${postId} 문서 updateDoc 성공.`);
    
        // 2. 이미지 변경 처리 (Storage 삭제)
        // updatedData에 'imageUrl' 필드가 포함되어 있고 (즉, 이미지가 새로 업로드되었거나 삭제되었고),
        // 기존 이미지 URL (oldImageUrl)이 유효하며, 새로운 이미지 URL (updatedData.imageUrl)이 기존과 다른 경우
        // (이미지 교체 또는 삭제) Storage에서 기존 이미지 삭제 시도
        // isNaN(oldImageUrl) 같은 체크는 URL 형식이 아닐 때 사용. 여기서는 String.prototype.includes 등으로 http/gs 확인도 가능
        if (Object.prototype.hasOwnProperty.call(updatedData, 'imageUrl') && oldImageUrl && typeof oldImageUrl === 'string' && (oldImageUrl.startsWith('http://') || oldImageUrl.startsWith('https://') || oldImageUrl.startsWith('gs://')) && oldImageUrl !== updatedData.imageUrl) {
          console.log(`[boardService] 이미지 변경 감지됨. 기존 이미지 ${oldImageUrl} 삭제 시도.`);
          try {
            // Storage 참조 생성 (URL에서 경로 추출 필요) - deletePost 함수에 있는 로직 재사용
            // Firebase Storage URL 형식: [https://firebasestorage.googleapis.com/v0/b/](https://firebasestorage.googleapis.com/v0/b/)<bucket>/o/<path>?...
            const imageUrl = oldImageUrl; // 삭제할 기존 이미지 URL
            const pathStartIndex = imageUrl.indexOf('/o/') + 3;
            const pathEndIndex = imageUrl.indexOf('?');
            let imagePathEncoded;
            if (pathEndIndex !== -1) {
              imagePathEncoded = imageUrl.substring(pathStartIndex, pathEndIndex);
            } else {
              imagePathEncoded = imageUrl.substring(pathStartIndex);
            }
            const imagePath = decodeURIComponent(imagePathEncoded);
    
            const imageStorageRef = storageRef(storage, imagePath);
    
            await deleteObject(imageStorageRef);
            console.log(`[boardService] Storage 이미지 ${imagePath} 삭제 성공.`);
    
          } catch (storageError) {
             console.error(`[boardService] Storage 이미지 삭제 오류 (${oldImageUrl}):`, storageError);
             // 이미지 삭제 실패하더라도 게시글 업데이트 자체는 성공했으므로 오류를 throw하지 않습니다.
            }
        } else if (Object.prototype.hasOwnProperty.call(updatedData, 'imageUrl')) {
            // updatedData에 imageUrl 필드는 있지만 (새 이미지 추가 또는 기존 이미지 삭제 시도였으나 기존 이미지가 없었거나)
            // oldImageUrl이 없거나 (원래 이미지 없었음) 또는 imageUrl === oldImageUrl (변경 없는데 imageUrl 필드가 넘어옴 - 드문 경우)
            console.log("[boardService] 이미지 상태 변경은 있었으나 삭제할 기존 이미지 없거나 변경되지 않음.");
        } else {
            // updatedData에 imageUrl 필드 자체가 없음 (이미지 변경 안 함)
            console.log("[boardService] 게시글 데이터 업데이트에 imageUrl 필드 없음 (이미지 변경 안 함).");
        }
    
    
          console.log(`[boardService] updatePost 완료. 게시글 ${postId} 업데이트됨.`);
    
        } catch (error) {
          console.error(`[boardService] 게시글 ${postId} 업데이트 오류:`, error);
          throw error; // 오류를 호출한 쪽 (BoardWriteView.vue)으로 다시 던져서 처리
        }
      };
    
    
      // 게시글에 댓글을 추가하는 함수 (BoardDetailView.vue에서 사용)
      // commentData 인자는 { text, parentId 등 } 포함
      // 이 함수 안에서 댓글 작성자 정보와 타임스탬프, 그리고 부모 게시글 commentCount 증가 처리
      const addCommentToPost = async (postId, commentData, currentUser) => { // currentUser 인자 추가
       console.log(`[boardService] addCommentToPost 시작. postId: ${postId}, commentData:`, commentData);
    
       try {
        // BoardDetailView.vue에서 currentUser를 받아오므로 여기서 getAuth() 다시 호출할 필요 없음
        // const auth = getAuth();
        // const user = auth.currentUser; // 현재 로그인 사용자 정보
    
        if (!currentUser) { // 전달받은 currentUser 사용
         // 댓글 작성 시 로그인 필수이므로 여기서도 확인하거나 호출하는 쪽에서 확인
         console.error("[boardService] 댓글 작성: 사용자 로그인되지 않음.");
         throw new Error("댓글 작성은 로그인 후 가능합니다.");
        }
        console.log("[boardService] 댓글 작성 사용자:", currentUser.uid); // 전달받은 currentUser 사용
    
        // 댓글 문서에 저장할 데이터 객체 생성
        const commentToAdd = {
          ...commentData, // 전달받은 댓글 내용 (text), parentId 등
          authorId: currentUser.uid, // 댓글 작성자 UID (전달받은 currentUser 사용)
          authorName: currentUser.displayName || currentUser.email || '익명', // 댓글 작성자 닉네임
          createdAt: serverTimestamp() // 서버 타임스탬프
        };
        console.log("[boardService] Firestore에 추가할 댓글 데이터:", commentToAdd);
    
    
        // 해당 게시글의 댓글 하위 컬렉션 참조: posts/{postId}/comments
        const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
    
        // Firestore에 새 댓글 문서 추가
        console.log(`[boardService] 댓글 문서 addDoc 시도: posts/${postId}/comments`);
        const docRef = await addDoc(commentsCollectionRef, commentToAdd);
        console.log(`[boardService] 댓글 문서 addDoc 성공. 문서 ID: ${docRef.id}`);
    
        // *** 부모 게시글의 commentCount 필드 1 증가 로직 (트랜잭션 사용) ***
        // 트랜잭션을 사용하여 원자적으로 업데이트 (여러 사용자가 동시에 댓글 작성 시 안정성 확보)
        console.log(`[boardService] commentCount 업데이트 시도 (트랜잭션): posts/${postId}`);
        const postRef = doc(db, 'posts', postId); // 부모 게시글 문서 참조
    
        try {
          await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
              throw "게시글 문서가 존재하지 않습니다!";
            }
    
            // 현재 commentCount 값을 가져와 1 증가
            // commentCount 필드가 없을 경우 0으로 간주하고 1 증가
            const newCommentCount = (postDoc.data().commentCount || 0) + 1;
    
            // commentCount 필드 업데이트
            transaction.update(postRef, { commentCount: newCommentCount });
    
            console.log(`[boardService] commentCount 트랜잭션 업데이트 완료. 새로운 count: ${newCommentCount}`);
          });
    
        } catch (transactionError) {
          console.error(`[boardService] commentCount 업데이트 트랜잭션 오류:`, transactionError);
          // commentCount 업데이트가 실패하더라도 댓글 추가 자체는 성공했으므로 오류를 throw하지 않을 수도 있습니다.
          // 여기서는 오류를 기록하고 함수는 계속 진행합니다.
        }
    
        console.log("[boardService] addCommentToPost 완료.");
        return docRef.id; // 추가된 댓글 문서 ID 반환
    
       } catch (error) {
        console.error("[boardService] addCommentToPost 전체 오류:", error);
        throw error; // 댓글 추가 자체 실패 시 오류 throw
       }
      };
    
      // 댓글 업데이트 함수 (BoardDetailView.vue에서 사용)
      const updateComment = async (postId, commentId, updatedText) => {
       console.log(`[boardService] updateComment 시작. postId: ${postId}, commentId: ${commentId}, updatedText: "${updatedText}"`);
       if (!postId || !commentId) {
        console.error("[boardService] updateComment: 게시글 또는 댓글 ID가 없습니다.");
        throw new Error("게시글 또는 댓글 ID가 없어 업데이트할 수 없습니다.");
       }
       if (!updatedText.trim()) {
        console.error("[boardService] updateComment: 업데이트할 댓글 내용이 비어 있습니다.");
        throw new Error("댓글 내용을 입력해주세요.");
       }
    
       // TODO: 보안을 위해 여기서도 댓글 작성자 본인인지 확인하는 로직 추가 필요 (Firestore 보안 규칙으로도 필수)
       // const auth = getAuth();
       // const user = auth.currentUser;
       // if (!user) { ... throw error ... }
       // 댓글 문서를 먼저 가져와서 authorId 확인 후 업데이트 진행
    
       const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    
       try {
        console.log(`[boardService] 댓글 ${commentId} 문서 updateDoc 시도. 데이터: { text: "${updatedText}" }`);
        await updateDoc(commentRef, {
         text: updatedText.trim(), // 앞뒤 공백 제거하여 저장
         // 필요하다면 updatedAt 필드 추가: updatedAt: serverTimestamp()
        });
        console.log(`[boardService] 댓글 ${commentId} 문서 updateDoc 성공.`);
    
       } catch (error) {
        console.error(`[boardService] 댓글 ${commentId} 업데이트 오류:`, error);
        throw error; // 오류를 호출한 쪽 (BoardDetailView.vue)으로 다시 던져서 처리
       }
      };
    
    
      // 게시글 삭제 함수 (BoardDetailView.vue에서 사용)
      const deletePost = async (postId) => {
       console.log(`[boardService] deletePost 시작. postId: ${postId}`);
       if (!postId) {
        console.error("[boardService] deletePost: 게시글 ID가 없습니다.");
        return; // 게시글 ID 없으면 종료
       }
    
       const auth = getAuth();
       const user = auth.currentUser; // 현재 로그인 사용자 정보
    
       if (!user) {
        console.error("[boardService] 게시글 삭제: 사용자 로그인되지 않음.");
        throw new Error("게시글 삭제는 로그인 후 가능합니다.");
       }
    
       const postRef = doc(db, 'posts', postId);
    
       try {
        // 삭제 전에 게시글 정보를 가져와 작성자 확인
        console.log(`[boardService] 게시글 ${postId} 작성자 확인을 위해 getDoc 시도`);
        const postSnapshot = await getDoc(postRef);
    
        if (!postSnapshot.exists()) {
         console.warn(`[boardService] deletePost: 게시글 ${postId}를 찾을 수 없습니다.`);
         throw new Error("삭제하려는 게시글을 찾을 수 없습니다.");
        }
    
        const postData = postSnapshot.data();
    
        // 작성자 본인인지 확인
        if (postData.authorId !== user.uid) {
         console.warn(`[boardService] 게시글 삭제 시도: ${postId}, 현재 사용자: ${user.uid}, 작성자: ${postData.authorId}`);
         console.warn("[boardService] 게시글 삭제: 작성자 불일치.");
         throw new Error("게시글 작성자만 삭제할 수 있습니다.");
        }
        console.log("[boardService] 게시글 삭제: 작성자 일치 확인. 삭제 진행.");
    
    
        // 이미지 URL이 있다면 Storage에서 이미지 삭제 (선택 사항)
        if (postData.imageUrl) {
         console.log(`[boardService] 연결된 이미지 ${postData.imageUrl} 삭제 시도`);
         try {
          // Storage 참조 생성 (URL에서 경로 추출 필요)
          // Firebase Storage URL 형식: [https://firebasestorage.googleapis.com/v0/b/](https://firebasestorage.googleapis.com/v0/b/)<bucket>/o/<path>?...
          const imageUrl = postData.imageUrl;
          const pathStartIndex = imageUrl.indexOf('/o/') + 3; // Find the start index of the path
          const pathEndIndex = imageUrl.indexOf('?'); // Find the end index (before query params)
          let imagePathEncoded;
          if (pathEndIndex !== -1) {
           imagePathEncoded = imageUrl.substring(pathStartIndex, pathEndIndex);
          } else {
           // No query parameters, take the rest of the string after /o/
           imagePathEncoded = imageUrl.substring(pathStartIndex);
          }
          const imagePath = decodeURIComponent(imagePathEncoded);
    
          const imageStorageRef = storageRef(storage, imagePath);
    
          await deleteObject(imageStorageRef);
          console.log(`[boardService] Storage 이미지 ${imagePath} 삭제 성공.`);
         } catch (storageError) {
          console.error(`[boardService] Storage 이미지 삭제 오류 (${postData.imageUrl}):`, storageError);
          // 이미지 삭제 실패하더라도 게시글 자체는 삭제되도록 오류를 throw하지 않음
         }
        } else {
         console.log("[boardService] 삭제할 연결된 이미지 없음.");
        }
    
    
        // TODO: 해당 게시글의 모든 댓글 하위 컬렉션도 삭제해야 합니다.
        // Firestore 규칙으로 재귀적 삭제를 설정하거나, Cloud Functions를 사용하여 삭제 시 트리거되도록 하거나,
        // 클라이언트에서 댓글을 먼저 모두 가져와 삭제하는 로직을 추가해야 합니다.
        // 여기서는 클라이언트에서 댓글을 모두 삭제하는 로직을 추가합니다.
        console.log(`[boardService] 게시글 ${postId}의 댓글 하위 컬렉션 삭제 시작.`);
        const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
        const commentsSnapshot = await getDocs(commentsCollectionRef);
    
        // 일괄 삭제를 위해 WriteBatch 사용 권장 (여기서는 간단히 순회하며 삭제)
        const deleteCommentPromises = [];
        commentsSnapshot.forEach((commentDoc) => {
         console.log(`[boardService] 댓글 ${commentDoc.id} 삭제 예약.`);
         deleteCommentPromises.push(deleteDoc(doc(commentsCollectionRef, commentDoc.id)));
        });
    
        // 모든 댓글 삭제 프로미스가 완료될 때까지 기다림
        await Promise.all(deleteCommentPromises);
        console.log(`[boardService] 게시글 ${postId} 댓글 ${deleteCommentPromises.length}개 삭제 완료.`);
    
          // *** 메인 게시글 문서 삭제 ***
          console.log(`[boardService] 메인 게시글 문서 ${postId} 삭제 시도.`);
          await deleteDoc(postRef); // <-- 이 줄을 추가했습니다.
          console.log(`[boardService] 메인 게시글 문서 ${postId} 삭제 성공.`);
    
    
        console.log(`[boardService] deletePost 완료.`); // 이제 게시글 자체도 삭제되었습니다.
    
       } catch (error) {
        console.error(`[boardService] 게시글 ${postId} 삭제 전체 오류:`, error);
        // 특정 오류 메시지는 이미 catch 블록 안에서 처리되었을 수 있습니다.
        throw error; // 오류를 호출한 쪽 (BoardDetailView.vue)으로 다시 던져서 처리
       }
      };
    
        // 댓글 삭제 함수 (BoardDetailView.vue에서 사용)
        // postId: 게시글 ID
        // commentId: 삭제할 댓글/답글 ID
        const deleteComment = async (postId, commentId) => {
            console.log(`[boardService] deleteComment 시작. postId: ${postId}, commentId: ${commentId}`);
             if (!postId || !commentId) {
                console.error("[boardService] deleteComment: 게시글 또는 댓글 ID가 없습니다.");
                throw new Error("게시글 또는 댓글 ID가 없어 삭제할 수 없습니다.");
            }
    
            // TODO: 보안을 위해 여기서도 댓글 작성자 본인인지 확인하는 로직 추가 필요 (Firestore 보안 규칙으로도 필수)
            // 댓글 문서를 먼저 가져와서 authorId 확인 후 삭제 진행
            // const auth = getAuth();
            // const user = auth.currentUser;
            // if (!user) { ... throw error ... }
    
    
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    
            try {
                console.log(`[boardService] 댓글 ${commentId} 문서 deleteDoc 시도.`);
                await deleteDoc(commentRef); // 댓글 문서 삭제
                console.log(`[boardService] 댓글 ${commentId} 문서 deleteDoc 성공.`);
    
                // *** 부모 게시글의 commentCount 필드 1 감소 로직 (트랜잭션 사용) ***
                // 댓글 삭제 시 commentCount 필드를 원자적으로 1 감소시킵니다.
                console.log(`[boardService] commentCount 업데이트 시도 (트랜잭션 - 감소): posts/${postId}`);
                const postRef = doc(db, 'posts', postId); // 부모 게시글 문서 참조
    
                try {
                    await runTransaction(db, async (transaction) => {
                        const postDoc = await transaction.get(postRef);
                        if (!postDoc.exists()) {
                            console.warn("[boardService] commentCount 감소 트랜잭션: 게시글 문서가 존재하지 않습니다.");
                            return; // 게시글이 없으면 감소할 commentCount도 없음
                        }
    
                        // 현재 commentCount 값을 가져와 1 감소
                        const currentCommentCount = postDoc.data().commentCount || 0;
                        const newCommentCount = Math.max(0, currentCommentCount - 1); // 0 미만으로 내려가지 않도록 방지
    
                        // commentCount 필드 업데이트
                        transaction.update(postRef, { commentCount: newCommentCount });
    
                        console.log(`[boardService] commentCount 트랜잭션 업데이트 완료. 새로운 count: ${newCommentCount}`);
                    });
    
                } catch (transactionError) {
                    console.error(`[boardService] commentCount 감소 트랜잭션 오류:`, transactionError);
                    // commentCount 업데이트 실패하더라도 댓글 삭제 자체는 성공했으므로 오류를 throw하지 않습니다.
                }
    
                console.log("[boardService] deleteComment 완료.");
    
            } catch (error) {
                console.error(`[boardService] 댓글 ${commentId} 삭제 오류:`, error);
                throw error; // 오류를 호출한 쪽 (BoardDetailView.vue)으로 다시 던져서 처리
            }
        };
    
    
      // 함수들을 내보냅니다.
      export {
       getPosts, // 게시글 목록 (실시간 리스너 사용 시 선택적)
       getPostById, // 게시글 상세
       createPost, // 게시글 작성
       addCommentToPost, // 댓글 추가 (댓글수 증가 포함)
       deletePost, // 게시글 삭제 (이미지, 댓글 삭제 포함)
       updatePost, // 게시글 업데이트 함수
          updateComment, // <--- updateComment 함수를 export 목록에 추가
          deleteComment // <--- deleteComment 함수를 export 목록에 추가 (BoardDetailView에서 import 함)
      };