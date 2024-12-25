import { getSelectedCellsGroups, getAfter30Minutes, getAfter6Months } from './calendar-utils.js';

export const handleEvaluationRequest = (selectedCells) => {
    if (selectedCells.length === 0) return;
    
    const dateGroups = getSelectedCellsGroups(selectedCells);
    
    Object.entries(dateGroups).forEach(([date, times]) => {
        requestEvaluation(date, times);
    });
};

const requestEvaluation = (date, times) => {
    times.forEach(time => {
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
                alert('평가 요청 완료');
            } else {
                alert('평가 요청 실패');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('평가 요청 중 오류가 발생했습니다');
        });
    });
};

const submitEvaluationForm = (date, times) => {
    const timeInput = document.querySelector('input[name="evalReqTime"]');
    const dateInput = document.querySelector('input[name="evalReqDate"]');
    const submitButton = document.querySelector('button[onclick^="fnEvalReqSave"]');
    
    if (!timeInput || !dateInput || !submitButton) return;
    
    timeInput.value = times.join(', ');
    dateInput.value = date;
    submitButton.click();
}; 