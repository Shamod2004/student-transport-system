import React from 'react'
import '../styles/DriverRouteAssignmentCard.css'

const DriverRouteAssignmentCard = ({ driver }) => {
  if (!driver) return null

  const { busDetails, routeDetails } = driver

  return (
    <div className="assignment-card">
      {/* Driver Section */}
      <div className="assignment-section driver-section">
        <h4>👨‍✈️ Driver Details</h4>
        <p><strong>Name:</strong> {driver.fullName}</p>
        <p><strong>Employee ID:</strong> {driver.employeeId}</p>
        <p><strong>License:</strong> {driver.licenseNumber}</p>
        <p><strong>License Expiry:</strong> {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Phone:</strong> {driver.phone}</p>
        <p>
          <strong>Status:</strong>
          <span className={`status-badge ${driver.status}`}>
            {driver.status}
          </span>
        </p>
      </div>

      {/* Bus Section */}
      {busDetails && (
        <div className="assignment-section bus-section">
          <h4>🚌 Assigned Bus</h4>
          <p><strong>Bus Number:</strong> {busDetails.busNumber}</p>
          <p><strong>Capacity:</strong> {busDetails.capacity} seats</p>
          <p><strong>Current Occupancy:</strong> {busDetails.currentOccupancy}/{busDetails.capacity}</p>
          <p>
            <strong>Bus Status:</strong>
            <span className={`status-badge ${busDetails.status}`}>
              {busDetails.status}
            </span>
          </p>
          {busDetails.departureTime && (
            <p><strong>Departure Time:</strong> {busDetails.departureTime}</p>
          )}
          {busDetails.estimatedArrivalTime && (
            <p><strong>Est. Arrival:</strong> {busDetails.estimatedArrivalTime}</p>
          )}
        </div>
      )}

      {/* Route Section */}
      {routeDetails && (
        <div className="assignment-section route-section">
          <h4>📍 Route Assignment</h4>
          <p><strong>Route Name:</strong> {routeDetails.routeName}</p>
          <p><strong>From:</strong> {routeDetails.departureLocation}</p>
          <p><strong>To:</strong> {routeDetails.arrivalLocation}</p>
          <p><strong>Departure:</strong> {routeDetails.departureTime}</p>
          <p><strong>Arrival:</strong> {routeDetails.arrivalTime}</p>
          <p><strong>Bus Type:</strong> {routeDetails.busType}</p>
          <p>
            <strong>Route Status:</strong>
            <span className={`status-badge ${routeDetails.status}`}>
              {routeDetails.status}
            </span>
          </p>
          <p><strong>Price per Seat:</strong> ${routeDetails.price}</p>
        </div>
      )}

      {!busDetails && !routeDetails && driver.assignedBus && (
        <div className="assignment-section empty-section">
          <p>⚠️ Assigned to bus "{driver.assignedBus}" but details not found</p>
        </div>
      )}

      {!driver.assignedBus && (
        <div className="assignment-section empty-section">
          <p>📭 No bus assigned</p>
        </div>
      )}
    </div>
  )
}

export default DriverRouteAssignmentCard
