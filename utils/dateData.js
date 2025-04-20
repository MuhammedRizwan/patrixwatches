module.exports = {
    getDailyDateRange: function() {
        const today = new Date()
        today.setHours(0,0,0,0)
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() +1)
        return {$gte: today, $lt: tomorrow}
    },

    getWeeklyDateRange: function(){
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        startOfWeek.setHours(0,0,0,0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate()+7)
        return { $gte: startOfWeek, $lt: endOfWeek}
    },

    getMonthlyDateRange: function() {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        startOfMonth.setHours(0,0,0,0)

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() +1, 0)
        endOfMonth.setHours(23,59,59,999)

        return { $gte: startOfMonth, $lte: endOfMonth }


    },

    getYearlyDateRange: function () {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(startOfYear);
        endOfYear.setFullYear(startOfYear.getFullYear() + 1);
        return { $gte: startOfYear, $lt: endOfYear };
      },
      
}