import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Import helper functions for consistent formatting
const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// Enhanced Schedule Report Generator with detailed comments
// This function creates a professional PDF report showing bus schedule information for a selected date
export const generateScheduleReport = (scheduleData) => {
    try {
        // Validate input data
        if (!scheduleData) {
            throw new Error('No schedule data provided')
        }
        
        if (!scheduleData.selectedDate) {
            throw new Error('No date selected for report')
        }
        
        // STEP 1: Initialize PDF document with standard settings
        const doc = new jsPDF()
        
        // STEP 2: Set default font for consistent text rendering
        doc.setFont('helvetica')
        
        // STEP 3: Add main report title with professional styling
        doc.setFontSize(20)
        doc.setTextColor(44, 62, 80) // Dark blue color for professional look
        doc.text('Bus Schedule Report', 105, 20, { align: 'center' })
        
        // STEP 4: Add selected date prominently below title
        // This helps users identify which date the report covers
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100) // Gray color for date text
        doc.text(`Date: ${formatDate(scheduleData.selectedDate)}`, 105, 30, { align: 'center' })
        
        // STEP 5: Add enhanced summary statistics section
        // This provides quick overview of all buses for the selected date
        doc.setFontSize(14)
        doc.setTextColor(44, 62, 80) // Dark blue for section headers
        doc.text('Summary Statistics', 14, 50)
        
        // STEP 6: Prepare comprehensive summary data for table
        // Include all relevant metrics for the selected date
        const summaryData = [
            ['Total Buses', scheduleData.summary?.totalBuses?.toString() || '0'],
            ['Certified Buses', scheduleData.summary?.certifiedBuses?.toString() || '0'],
            ['Pending Buses', scheduleData.summary?.pendingBuses?.toString() || '0'],
            ['Total Seats', scheduleData.summary?.totalSeats?.toString() || '0'],
            ['Available Seats', scheduleData.summary?.totalAvailableSeats?.toString() || '0'],
            ['Booked Seats', scheduleData.summary?.totalBookedSeats?.toString() || '0'],
            ['Fully Booked', scheduleData.summary?.fullyBookedBuses?.toString() || '0'],
            ['Morning Buses', scheduleData.summary?.morningBuses?.toString() || '0'],
            ['Afternoon Buses', scheduleData.summary?.afternoonBuses?.toString() || '0'],
            ['Evening Buses', scheduleData.summary?.eveningBuses?.toString() || '0'],
            ['Night Buses', scheduleData.summary?.nightBuses?.toString() || '0']
        ]
        
        // STEP 7: Generate summary table with professional styling
        autoTable(doc, {
            head: [['Metric', 'Value']],
            body: summaryData,
            startY: 60,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246], // Blue header
                textColor: 255,             // White text
                fontStyle: 'bold'            // Bold text
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // Light gray for alternate rows
            },
            margin: { left: 14, right: 14 }
        })
        
        // STEP 8: Add detailed bus information table
        // This shows comprehensive data for each bus scheduled on the selected date
        const tableY = doc.lastAutoTable.finalY + 15
        doc.setFontSize(14)
        doc.setTextColor(44, 62, 80) // Dark blue for section headers
        doc.text('Detailed Bus Information', 14, tableY)
        
        // STEP 9: Prepare bus data for detailed table
        // Include all relevant bus information in organized columns
        const busData = scheduleData.buses?.map(bus => [
            bus.busId || 'N/A',
            bus.routeName || 'N/A',
            bus.departureTime || '--:--',
            bus.arrivalTime || '--:--',
            bus.departureLocation || 'N/A',
            bus.arrivalLocation || 'N/A',
            bus.totalSeats?.toString() || '0',
            bus.availableSeats?.toString() || '0',
            bus.bookedSeats?.toString() || '0',
            `${bus.seatUtilization || 0}%`,
            bus.status || 'Unknown',
            getTimeCategoryLabel(bus.timeCategory)
        ]) || []
        
        // STEP 10: Generate detailed bus table with enhanced styling
        autoTable(doc, {
            head: [['Bus ID', 'Route', 'Departure', 'Arrival', 'From', 'To', 'Total Seats', 'Available', 'Booked', 'Utilization', 'Status', 'Time Slot']],
            body: busData,
            startY: tableY + 5,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246], // Blue header
                textColor: 255,             // White text
                fontStyle: 'bold'            // Bold text
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // Light gray for alternate rows
            },
            margin: { left: 14, right: 14 },
            didDrawCell: (data) => {
                // STEP 11: Add visual highlights for better readability
                // Color code utilization and status for quick scanning
                if (data.column.index === 9) { // Utilization column
                    const utilization = parseInt(data.cell.raw) || 0
                    let fillColor
                    
                    if (utilization >= 90) {
                        fillColor = [239, 68, 68] // Red for high utilization
                    } else if (utilization >= 70) {
                        fillColor = [245, 158, 11] // Yellow for medium utilization
                    } else {
                        fillColor = [34, 197, 94] // Green for low utilization
                    }
                    
                    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
                    doc.setTextColor(255) // White text
                    doc.text(data.cell.raw, data.cell.x + 2, data.cell.y + 7)
                }
                
                if (data.column.index === 10) { // Status column
                    const status = data.cell.raw
                    let fillColor, textColor
                    
                    if (status === 'Certified') {
                        fillColor = [34, 197, 94] // Green background
                        textColor = 255 // White text
                    } else if (status === 'Pending') {
                        fillColor = [245, 158, 11] // Yellow background
                        textColor = 0 // Black text
                    } else {
                        fillColor = [156, 163, 175] // Gray background
                        textColor = 255 // White text
                    }
                    
                    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
                    doc.setTextColor(textColor)
                    doc.text(status, data.cell.x + 2, data.cell.y + 7)
                }
            }
        })
        
        // STEP 12: Add time slot legend for user reference
        // This helps users understand the color coding used in the table
        const legendY = doc.lastAutoTable.finalY + 15
        doc.setFontSize(12)
        doc.setTextColor(44, 62, 80) // Dark blue for legend header
        doc.text('Time Slot Legend', 14, legendY)
        
        const legendData = [
            ['Morning (5AM-12PM)', 'Early day departures'],
            ['Afternoon (12PM-5PM)', 'Mid-day departures'],
            ['Evening (5PM-9PM)', 'Evening departures'],
            ['Night (9PM-5AM)', 'Late night departures']
        ]
        
        autoTable(doc, {
            head: [['Time Slot', 'Description']],
            body: legendData,
            startY: legendY + 5,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246], // Blue header
                textColor: 255,             // White text
                fontStyle: 'bold'            // Bold text
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // Light gray for alternate rows
            },
            margin: { left: 14, right: 14 }
        })
        
        // STEP 13: Add professional footer with generation details
        const finalY2 = doc.lastAutoTable.finalY + 20
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150) // Light gray for footer text
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, finalY2, { align: 'center' })
        doc.text('Student Transport Management System', 105, finalY2 + 5, { align: 'center' })
        
        // STEP 14: Save PDF with descriptive filename
        // Filename includes the selected date for easy identification
        const fileName = `enhanced-schedule-report-${scheduleData.selectedDate}.pdf`
        doc.save(fileName)
        
        return { success: true, fileName }
        
    } catch (error) {
        console.error('Error generating schedule report:', error)
        return { success: false, error: error.message }
    }
}

// Helper function to get user-friendly time category labels
const getTimeCategoryLabel = (category) => {
    switch (category) {
        case 'morning':
            return 'Morning'
        case 'afternoon':
            return 'Afternoon'
        case 'evening':
            return 'Evening'
        case 'night':
            return 'Night'
        default:
            return 'Unknown'
    }
}

// Helper function to format time consistently
const formatTime = (timeString) => {
    if (!timeString) return '--:--'
    
    // Validate HH:MM format and return as-is if valid
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (timeRegex.test(timeString)) {
        return timeString
    }
    
    // Try to parse and format time string
    try {
        const date = new Date(`2000-01-01T${timeString}`)
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        })
    } catch {
        return timeString // Return original if parsing fails
    }
}
