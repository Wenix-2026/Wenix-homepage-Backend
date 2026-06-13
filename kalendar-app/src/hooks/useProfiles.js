import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .order('full_name')
      .then(({ data }) => {
        setProfiles(data || [])
        setLoading(false)
      })
  }, [])

  return { profiles, loading }
}
