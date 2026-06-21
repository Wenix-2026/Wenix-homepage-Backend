import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfiles() {
    const [profiles, setProfiles] = useState([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState(null)

    useEffect(() => {
        supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .order('full_name')
            .then(({ data, error }) => {
                if (error) setError(error.message)
                setProfiles(data || [])
                setLoading(false)
            })
    }, [])

    return { profiles, loading, error }
}