import { getSelectedCellsGroups } from './calendar-utils.js';

export const handleEvaluationRequest = (selectedCells) => {
    if (selectedCells.length === 0) return;
    
    const dateGroups = getSelectedCellsGroups(selectedCells);
    alert('평가 요청 완료');
    
    Object.entries(dateGroups).forEach(([date, times]) => {
        requestEvaluation(date, times);
    });
};

const requestEvaluation = (date, times) => {
    const evaluationRequestButton = document.querySelector('button.btn.btn-primary[onclick^="fnEvalReqPopup"]');
    if (!evaluationRequestButton) return;
    
    evaluationRequestButton.click();
    setTimeout(() => submitEvaluationForm(date, times), 500);
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