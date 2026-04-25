import { useState, useEffect } from 'react'
import api from '../services/api'

// Custom hook for data fetching
const useFetch = (endpoint) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(endpoint)
        setData(res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [endpoint])

  return { data, loading, error }
}

export default useFetch
