import React, { useState } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'

// Delete Confirmation Modal component
const DeleteModal = ({ route, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false)

  // Handle delete confirmation
  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
    } catch (error) {
      console.error('Error deleting route:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete Route
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-8 h-8 text-danger-500" />
            <div>
              <p className="text-gray-900 font-medium">
                Are you sure you want to delete this route?
              </p>
              <p className="text-gray-500 text-sm mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Route Details */}
          {route && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Route Details:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bus ID:</span>
                  <span className="font-medium">{route.busId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{route.routeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{route.departureLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{route.arrivalLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{route.departureDate ? new Date(route.departureDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-danger-800">
              <strong>Warning:</strong> Deleting this route will permanently remove all associated data including schedules and passenger information.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </span>
              ) : (
                'Delete Route'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
