// 날짜 관련 유틸리티 함수들
export const getCurrentWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return { today, monday };
};

export const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatTimeSlot = (timeSlot) => {
    const hour = Math.floor(timeSlot / 2);
    const isFirstHalf = timeSlot % 2 === 0;
    const startTime = `${hour.toString().padStart(2, '0')}:${isFirstHalf ? '00' : '30'}`;
    const endTime = `${(isFirstHalf ? hour : Math.floor((timeSlot + 1) / 2)).toString().padStart(2, '0')}:${isFirstHalf ? '30' : '00'}`;
    return { startTime, endTime };
};

// 선택 관련 유틸리티 함수들
export const clearSelection = (timeTable) => {
    const selectedCells = timeTable.querySelectorAll('.selected');
    selectedCells.forEach(cell => cell.classList.remove('selected'));
};

export const getSelectedCellsGroups = (selectedCells) => {
    const dateGroups = {};
    selectedCells.forEach(cell => {
        const timeSlot = parseInt(cell.dataset.timeSlot);
        const day = parseInt(cell.dataset.day);
        const hour = Math.floor(timeSlot / 2);
        const minute = (timeSlot % 2) * 30;
        
        const { monday } = getCurrentWeekDates();
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + day);
        
        const dateKey = formatDateKey(targetDate);
        if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    });
    return dateGroups;
}; 