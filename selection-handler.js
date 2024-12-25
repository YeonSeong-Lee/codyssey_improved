export const selectCellsBetween = (timeTable, start, end, shouldRemove = false) => {
    if (!start || !end) return;
    
    const startTimeSlot = parseInt(start.dataset.timeSlot);
    const startDay = parseInt(start.dataset.day);
    const endTimeSlot = parseInt(end.dataset.timeSlot);
    const endDay = parseInt(end.dataset.day);
    
    const minTimeSlot = Math.min(startTimeSlot, endTimeSlot);
    const maxTimeSlot = Math.max(startTimeSlot, endTimeSlot);
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);
    
    updateCellsInRange(timeTable, minTimeSlot, maxTimeSlot, minDay, maxDay, shouldRemove);
};

const updateCellsInRange = (timeTable, minTimeSlot, maxTimeSlot, minDay, maxDay, shouldRemove) => {
    for (let timeSlot = minTimeSlot; timeSlot <= maxTimeSlot; timeSlot++) {
        for (let day = minDay; day <= maxDay; day++) {
            const cell = timeTable.querySelector(`[data-time-slot="${timeSlot}"][data-day="${day}"]`);
            if (cell && !cell.classList.contains('disabled')) {
                if (shouldRemove) {
                    cell.classList.remove('selected');
                } else {
                    cell.classList.add('selected');
                }
            }
        }
    }
}; 