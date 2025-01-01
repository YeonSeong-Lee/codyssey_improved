import { getSelectedCellsGroups, getAfter30Minutes, getAfter6Months } from './calendar-utils.js';

export const handleEvaluationRequest = (selectedCells) => {
    if (selectedCells.length === 0) return;
    
    const dateGroups = getSelectedCellsGroups(selectedCells);
    
    Object.entries(dateGroups).forEach(([date, times]) => {
        requestEvaluations(date, times);
    });
};

async function requestEvaluations(date, selectedTimes) {
    const promises = [];
    for (const time of selectedTimes) {
        promises.push(requestEvaluation(date, time));
    }

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error('평가 요청 중 오류 발생:', error);
    } finally {
        window.location.reload();
    }
}

const requestEvaluation = (date, time) => {
    const startTime = time;
    const endTime = getAfter30Minutes(time);
    const rpttEndYmd = getAfter6Months(date);
    const formData = new FormData();
    
    formData.append('evlPsblYmd', date);
    formData.append('evlPsblTm', startTime);
    formData.append('evlPsblEndTm', endTime);
    formData.append('rpttYn', 'N');
    formData.append('rpttDivCd', '01');
    formData.append('rpttEndYmd', rpttEndYmd);

    fetch('https://usr.codyssey.kr/schedule/psblScheduleSave', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            console.info(`${date} ${startTime} ~ ${endTime} 평가 요청 완료`);
        } else {
            console.error(`${date} ${startTime} ~ ${endTime} 평가 요청 실패`);
        }
    })
};


/**
 * 날짜별 평가시간 추출 함수
 * @param {Array} timeList - 평가 요청 목록
 * @returns {Object} - 날짜별 평가시간 객체
 * @example
 * {
 *   "2025.01.01": [
 *     { timeSlot: "00:00 ~ 00:30", evlScdlSn: "1" },
 *     { timeSlot: "00:30 ~ 01:00", evlScdlSn: "2" },
 *     { timeSlot: "01:00 ~ 01:30", evlScdlSn: "3" }
 *   ]
 * }
 */
const organizeTimeListByDate = (timeList) => {
    return timeList.reduce((acc, item) => {
        const date = item.bgngYmd;  // "2025.01.01" 형식
        const timeSlot = item.fixedNm;  // "00:00 ~ 00:30" 형식
        const evlScdlSn = item.scdlId;  // 평가 일련번호

        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push({ timeSlot, evlScdlSn });

        return acc;
    }, {});
};

/**
 * 평가 요청 목록 조회
 * @param {string} startYmd - 시작 날짜 (YYYY.MM.DD)
 * @param {string} endYmd - 종료 날짜 (YYYY.MM.DD)
 * @returns {Promise<Response>} - 평가 요청 목록 조회 결과
 */
export const fetchEvaluation = (startYmd, endYmd) => {
    const formData = new FormData()
    formData.append('bgngYmd', startYmd);
    formData.append('endYmd', endYmd);
    formData.append('scheculeType', 'request');
    formData.append('searchType', 'T');

    return fetch(`https://usr.codyssey.kr/schedule/scheduleAllList/`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => organizeTimeListByDate(data.result.timeList));
};


/**
 * 평가 삭제
 * @param {string} evlScdlSn - 평가 일련번호
 */
export const deleteEvaluation = (evlScdlSn) => {
    const formData = new FormData();
    formData.append('evlScdlSn', evlScdlSn);

    fetch('https://usr.codyssey.kr/schedule/psblScheduleDelete', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            console.info(`${evlScdlSn} 평가 삭제 완료`);
        } else {
            console.error(`${evlScdlSn} 평가 삭제 실패`);
        }
    });
};
