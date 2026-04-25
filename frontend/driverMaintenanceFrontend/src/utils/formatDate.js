// Format a date to readable string
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Capitalize first letter
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
