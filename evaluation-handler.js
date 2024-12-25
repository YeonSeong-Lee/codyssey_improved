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
