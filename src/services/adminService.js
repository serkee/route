// src/services/adminService.js

// Firestore에서 문서 삭제 함수 import
import { doc, deleteDoc } from 'firebase/firestore';
// Firebase 설정 파일에서 db 인스턴스 import
import { db } from '@/firebase';

// 백엔드(Cloud Functions) 호출이 필요하다면 주석 해제 및 SDK 설치 필요
// import { getFunctions, httpsCallable } from 'firebase/functions';


/**
 * 관리자 권한으로 사용자 계정 삭제를 시도합니다.
 * Firestore 문서 삭제 및 백엔드(Cloud Functions) 호출을 포함합니다.
 * @param {string} uid - 삭제할 사용자의 UID
 * @returns {Promise<{success: boolean, message?: string}>} - 삭제 결과
 */
const deleteUserAccount = async (uid) => {
  console.log(`[adminService] 사용자 계정 삭제 시도 (UID: ${uid})`);
  try {
    // ✅ STEP 1: 해당 사용자의 Firestore 문서 삭제
    // 이 부분은 클라이언트에서 직접 삭제 가능 (Firestore 보안 규칙 설정 필수!)
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
    console.log(`[adminService] Firestore 사용자 문서 ${uid} 삭제 성공.`);

    // ✅✅✅ STEP 2: Firebase Authentication 사용자 계정 삭제 및 관련 데이터 정리 (백엔드 필수) ✅✅✅
    // 이 부분은 클라이언트에서 직접 다른 사용자의 Auth 계정을 삭제할 수 없습니다.
    // 반드시 Firebase Cloud Functions와 같은 안전한 백엔드에서 Admin SDK를 사용하여 구현해야 합니다.
    // 아래는 Cloud Function을 호출하는 예시 코드입니다. 실제 함수 구현은 별도 진행해야 합니다.

    /*
    // 예시: 'deleteUserCallable' 이름의 Cloud Function 호출
    const functions = getFunctions(); // Firebase Functions 인스턴스 가져오기
    // 백엔드에 구현된 삭제 함수 참조 (함수 이름은 백엔드에 맞게 수정)
    const deleteUserCallable = httpsCallable(functions, 'deleteUserCallable');

    try {
        // 백엔드 함수에 삭제할 사용자의 UID 전달
        const result = await deleteUserCallable({ uid: uid });
        console.log('[adminService] Cloud Function 호출 결과:', result.data);
        // 백엔드 함수의 응답에 따라 최종 성공/실패 처리
        if (result.data && result.data.success) {
             console.log(`[adminService] 백엔드 사용자 삭제 및 정리 성공 (UID: ${uid}).`);
        } else {
             console.error('[adminService] 백엔드 사용자 삭제 요청 실패:', result.data?.message || '알 수 없는 오류');
             throw new Error(result.data?.message || "백엔드 사용자 삭제 요청 실패");
        }

    } catch (functionError) {
        console.error('[adminService] Cloud Function 호출 오류:', functionError);
        // 백엔드 호출 실패 또는 함수 내 오류 발생 시 처리
        throw new Error("사용자 삭제 중 백엔드 오류 발생: " + functionError.message);
    }
    */

    // Cloud Functions를 아직 사용하지 않는 경우, 백엔드 삭제가 누락되었음을 알림
    console.warn("[adminService] Firebase Authentication 사용자 계정 삭제 및 관련 데이터(게시글, 댓글 등) 정리 로직은 백엔드(Cloud Functions 등)에서 구현해야 합니다. 현재는 Firestore 문서만 삭제되었습니다.");


    console.log(`[adminService] 사용자 계정 삭제 프로세스 완료 (UID: ${uid}).`);
    // 최종 결과 반환 (백엔드 호출 결과 포함 시 수정 필요)
    return { success: true, message: "Firestore 문서 삭제 완료. 백엔드 삭제 필요." };

  } catch (error) {
    console.error(`[adminService] 사용자 계정 삭제 전체 오류 (UID: ${uid}):`, error);
    // 오류 발생 시 호출한 곳으로 오류 다시 던지기
    throw error;
  }
};

// 서비스 함수 내보내기
export { deleteUserAccount };