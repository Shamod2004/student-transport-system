import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, prepareReportData, calculateDuration } from './helpers'

// PDF report generate karanna Master Timetable Report ekak
export const generateRouteReport = (routes, filters = {}) => {
  try {
    // jsPDF instance eka create karanna
    const doc = new jsPDF()
    
    // Page setup
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Title add karanna
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Master Timetable Report', pageWidth / 2, 20, { align: 'center' })
    
    // Report date add karanna
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 30, { align: 'center' })
    
    // Filters add karanna if available
    let yPos = 45
    if (Object.keys(filters).length > 0) {
      doc.setFontSize(10)
      doc.text('Applied Filters:', 20, yPos)
      yPos += 7
      
      if (filters.search) {
        doc.text(`Search: ${filters.search}`, 25, yPos)
        yPos += 5
      }
      
      if (filters.from) {
        doc.text(`From: ${filters.from}`, 25, yPos)
        yPos += 5
      }
      
      if (filters.to) {
        doc.text(`To: ${filters.to}`, 25, yPos)
        yPos += 5
      }
      
      if (filters.startDate || filters.endDate) {
        const dateRange = filters.startDate && filters.endDate 
          ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
          : filters.startDate 
            ? `From: ${formatDate(filters.startDate)}`
            : `To: ${formatDate(filters.endDate)}`
        doc.text(`Date Range: ${dateRange}`, 25, yPos)
        yPos += 5
      }
      
      yPos += 5
    }
    
    // Summary statistics add karanna
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Routes: ${routes.length}`, 20, yPos)
    yPos += 10
    
    // Table data prepare karanna with calculated duration
    const tableData = routes.map(route => {
      // STEP 1: Calculate duration for each route using the same logic as the table
      // This ensures consistency between table display and PDF report
      const calculatedDuration = calculateDuration(route.departureTime, route.arrivalTime)
      
      // STEP 2: Prepare table row with all route information
      // Use calculated duration instead of route.duration property
      return [
        route.busId,
        route.routeName,
        route.busType,
        route.status,
        `${route.departureLocation} - ${route.departureTime}`,
        `${route.arrivalLocation} - ${route.arrivalTime}`,
        formatDate(route.departureDate),
        calculatedDuration || 'N/A' // Use calculated duration or fallback
      ]
    })
    
    // Table headers define karanna
    const tableHeaders = [
      'Bus ID',
      'Route Name',
      'Bus Type',
      'Status',
      'Departure',
      'Arrival',
      'Date',
      'Duration'
    ]
    
    // Auto table add karanna
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPos,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Primary blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Light gray for alternate rows
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Bus ID
        1: { cellWidth: 30 }, // Route Name
        2: { cellWidth: 25 }, // Bus Type
        3: { cellWidth: 25 }, // Status
        4: { cellWidth: 35 }, // Departure
        5: { cellWidth: 35 }, // Arrival
        6: { cellWidth: 25 }, // Date
        7: { cellWidth: 20 }, // Duration
      },
      // Page break handle karanna
      didDrawPage: (data) => {
        // Footer add karanna
        const footerY = pageHeight - 10
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        )
      },
      // Row height adjust karanna content base karanna
      rowHeight: (row) => {
        const maxCellLength = Math.max(...row.map(cell => String(cell).length))
        return maxCellLength > 30 ? 10 : 8
      }
    })
    
    // File download karanna
    const fileName = `Route_Schedule_Report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    return { success: true, fileName }
  } catch (error) {
    console.error('PDF generation error:', error)
    return { 
      success: false, 
      error: 'Failed to generate PDF report. Please try again.' 
    }
  }
}

// Individual route PDF generate karanna with calculated duration
export const generateRouteTicket = (route) => {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Route Details', pageWidth / 2, 20, { align: 'center' })
    
    // Route information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    let yPos = 40
    const lineHeight = 10
    
    // STEP 1: Calculate duration for the route using same logic as main table
    // This ensures consistency between table display and individual tickets
    const calculatedDuration = calculateDuration(route.departureTime, route.arrivalTime)
    
    // STEP 2: Prepare route information with calculated duration
    // Use calculated duration instead of route.duration property
    const routeInfo = [
      { label: 'Bus ID:', value: route.busId },
      { label: 'Route Name:', value: route.routeName },
      { label: 'Bus Type:', value: route.busType },
      { label: 'Status:', value: route.status },
      { label: 'Departure:', value: `${route.departureLocation} - ${route.departureTime}` },
      { label: 'Arrival:', value: `${route.arrivalLocation} - ${route.arrivalTime}` },
      { label: 'Date:', value: formatDate(route.departureDate) },
      { label: 'Duration:', value: calculatedDuration || 'N/A' }, // Use calculated duration
    ]
    
    routeInfo.forEach(info => {
      doc.setFont('helvetica', 'bold')
      doc.text(info.label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(info.value, 60, yPos)
      yPos += lineHeight
    })
    
    // Bus image add karanna if available
    if (route.busImageUrl) {
      try {
        doc.addImage(route.busImageUrl, 'JPEG', 20, yPos + 10, 60, 40)
      } catch (error) {
        console.log('Could not load bus image')
      }
    }
    
    // File download karanna
    const fileName = `Route_${route.busId}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    return { success: true, fileName }
  } catch (error) {
    console.error('Ticket generation error:', error)
    return { 
      success: false, 
      error: 'Failed to generate route ticket. Please try again.' 
    }
  }
}
