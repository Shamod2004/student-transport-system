import React, { useState, useEffect } from 'react'
import { routeAPI } from '../services/api'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Bus, X } from 'lucide-react'

const RouteModal = ({ isOpen, onClose, route, onSave, isStatusOnlyMode = false }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    busImageUrl: '',
    busId: '',
    routeName: '',
    busType: '',
    status: 'Certified',
    departureTime: '',
    arrivalTime: '',
    departureLocation: '',
    arrivalLocation: '',
    departureDate: '',
    price: ''
  })

  useEffect(() => {
    if (route && isOpen) {
      setFormData({
        busImageUrl: route.busImageUrl || '',
        busId: route.busId || '',
        routeName: route.routeName || '',
        busType: route.busType || '',
        status: route.status || 'Certified',
        departureTime: route.departureTime || '',
        arrivalTime: route.arrivalTime || '',
        departureLocation: route.departureLocation || '',
        arrivalLocation: route.arrivalLocation || '',
        departureDate: route.departureDate ? new Date(route.departureDate).toISOString().split('T')[0] : '',
        price: route.price || ''
      })
      setPreviewSrc(route.busImageUrl || '')
    } else if (isOpen) {
      // Reset form for new route
      setFormData({
        busImageUrl: '',
        busId: '',
        routeName: '',
        busType: '',
        status: 'Certified',
        departureTime: '',
        arrivalTime: '',
        departureLocation: '',
        arrivalLocation: '',
        departureDate: '',
        price: ''
      })
      setPreviewSrc('')
    }
    setSelectedFile(null)
    setErrors({})
  }, [route, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          busImageUrl: 'Please select an image file'
        }))
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          busImageUrl: 'Image size should be less than 5MB'
        }))
        return
      }

      setSelectedFile(file)
      setErrors(prev => ({
        ...prev,
        busImageUrl: ''
      }))

      // Generate preview
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewSrc(reader.result)
      }
      reader.onerror = () => {
        setErrors(prev => ({
          ...prev,
          busImageUrl: 'Failed to read image file'
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      if (isStatusOnlyMode) {
        const newErrors = {}
        
        if (!formData.status.trim()) {
          newErrors.status = 'Status is required'
        }
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
          return
        }
        
        await onSave({ status: formData.status })
        return
      }
      
      const newErrors = {}
      
      if (!selectedFile && !formData.busImageUrl.trim()) {
        newErrors.busImageUrl = 'Bus image is required (upload file or provide URL)'
      }
      if (!formData.busId.trim()) {
        newErrors.busId = 'Bus ID is required'
      }
      if (!formData.routeName.trim()) {
        newErrors.routeName = 'Route name is required'
      }
      if (!formData.busType.trim()) {
        newErrors.busType = 'Bus type is required'
      }
      if (!formData.departureTime.trim()) {
        newErrors.departureTime = 'Departure time is required'
      }
      if (!formData.arrivalTime.trim()) {
        newErrors.arrivalTime = 'Arrival time is required'
      }
      if (!formData.departureLocation.trim()) {
        newErrors.departureLocation = 'Departure location is required'
      }
      if (!formData.arrivalLocation.trim()) {
        newErrors.arrivalLocation = 'Arrival location is required'
      }
      if (!formData.departureDate) {
        newErrors.departureDate = 'Departure date is required'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      // Prepare submission data
      const submissionData = { ...formData }
      
      // Handle image
      if (selectedFile) {
        // In a real app, you'd upload the file to a server and get a URL
        // For now, we'll use a placeholder or the preview
        submissionData.busImageUrl = previewSrc
      }

      await onSave(submissionData)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(getErrorMessage(error) || 'Failed to save route')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bus className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isStatusOnlyMode ? 'Update Route Status' : route ? 'Edit Route' : 'Add New Route'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {isStatusOnlyMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="input-field"
                >
                  <option value="Certified">Certified</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="error-message">{errors.status}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Image
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100"
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewSrc('')
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {errors.busImageUrl && (
                      <p className="error-message">{errors.busImageUrl}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or provide Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.busImageUrl}
                      onChange={(e) => handleInputChange('busImageUrl', e.target.value)}
                      placeholder="https://example.com/bus-image.jpg"
                      className="input-field"
                    />
                  </div>

                  {(previewSrc || formData.busImageUrl) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={previewSrc || formData.busImageUrl}
                          alt="Bus preview"
                          className="w-full h-full object-cover"
                          style={{ maxWidth: "100%", maxHeight: "300px" }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            const fallbackDiv = e.target.nextElementSibling
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'flex'
                            }
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block'
                            const fallbackDiv = e.target.nextElementSibling
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'none'
                            }
                          }}
                        />
                        <div className="w-full h-full bg-gray-100 items-center justify-center hidden" style={{ display: 'none' }}>
                          <Bus className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus ID
                </label>
                <input
                  type="text"
                  value={formData.busId}
                  onChange={(e) => handleInputChange('busId', e.target.value.toUpperCase())}
                  placeholder="e.g., BUS001"
                  className="input-field"
                />
                {errors.busId && (
                  <p className="error-message">{errors.busId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Name
                </label>
                <input
                  type="text"
                  value={formData.routeName}
                  onChange={(e) => handleInputChange('routeName', e.target.value)}
                  placeholder="e.g., Colombo to Kandy"
                  className="input-field"
                />
                {errors.routeName && (
                  <p className="error-message">{errors.routeName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Type
                </label>
                <select
                  value={formData.busType}
                  onChange={(e) => handleInputChange('busType', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select bus type</option>
                  <option value="AC">AC Bus</option>
                  <option value="Non-AC">Non-AC Bus</option>
                  <option value="Luxury">Luxury Bus</option>
                  <option value="Semi-Luxury">Semi-Luxury Bus</option>
                  <option value="Normal">Normal Bus</option>
                </select>
                {errors.busType && (
                  <p className="error-message">{errors.busType}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => handleInputChange('departureTime', e.target.value)}
                    className="input-field"
                  />
                  {errors.departureTime && (
                    <p className="error-message">{errors.departureTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                    className="input-field"
                  />
                  {errors.arrivalTime && (
                    <p className="error-message">{errors.arrivalTime}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Location
                  </label>
                  <input
                    type="text"
                    value={formData.departureLocation}
                    onChange={(e) => handleInputChange('departureLocation', e.target.value)}
                    placeholder="e.g., Colombo"
                    className="input-field"
                  />
                  {errors.departureLocation && (
                    <p className="error-message">{errors.departureLocation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Location
                  </label>
                  <input
                    type="text"
                    value={formData.arrivalLocation}
                    onChange={(e) => handleInputChange('arrivalLocation', e.target.value)}
                    placeholder="e.g., Kandy"
                    className="input-field"
                  />
                  {errors.arrivalLocation && (
                    <p className="error-message">{errors.arrivalLocation}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
                {errors.departureDate && (
                  <p className="error-message">{errors.departureDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (LKR)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., 500"
                  min="0"
                  step="0.01"
                  className="input-field"
                />
                {errors.price && (
                  <p className="error-message">{errors.price}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isStatusOnlyMode ? 'Updating...' : (route ? 'Updating...' : 'Creating...')}
                </span>
              ) : (
                isStatusOnlyMode ? 'Update Status' : (route ? 'Update Route' : 'Create Route')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RouteModal
