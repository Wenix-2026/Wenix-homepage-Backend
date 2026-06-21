import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEvents(year, month) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const current  = new Date()
    const safeYear  = (typeof year === 'number' && !isNaN(year)) ? year : current.getFullYear()
    const safeMonth = (typeof month === 'number' && !isNaN(month)) ? month : current.getMonth()

    try {
      const from = new Date(safeYear, safeMonth, 1).toISOString()
      const to   = new Date(safeYear, safeMonth + 1, 1).toISOString()

      const { data, error: fetchError } = await supabase
          .from('events')
          .select(`
          *,
          profiles:created_by ( id, full_name, email, avatar_url ),
          event_assignees (
            profile_id,
            profiles ( id, full_name, email, avatar_url )
          )
        `)
          .gte('start_time', from)
          .lt('start_time', to)
          .order('start_time')

      if (fetchError) throw fetchError
      setEvents(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function createEvent(payload) {
    const { assigneeIds = [], ...eventData } = payload

    if (!eventData.created_by) {
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) {
        throw new Error('Nejsi přihlášen — událost nelze uložit bez identity autora.')
      }
      eventData.created_by = userData.user.id
    }

    const { data: event, error: evErr } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

    if (evErr) throw new Error(evErr.message)

    if (assigneeIds.length > 0) {
      const rows = assigneeIds.map((profile_id) => ({ event_id: event.id, profile_id }))
      const { error: asErr } = await supabase.from('event_assignees').insert(rows)
      if (asErr) throw new Error(asErr.message)
    }

    await fetchEvents()
    return event
  }

  async function updateEvent(eventId, payload) {
    const { assigneeIds, id, ...eventData } = payload

    const { error: evErr } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)

    if (evErr) throw new Error(evErr.message)

    if (assigneeIds !== undefined) {
      const { error: delErr } = await supabase
          .from('event_assignees')
          .delete()
          .eq('event_id', eventId)

      if (delErr) throw new Error(`Smazání starých assignees selhalo: ${delErr.message}`)

      if (assigneeIds.length > 0) {
        const rows = assigneeIds.map((profile_id) => ({ event_id: eventId, profile_id }))

        const { error: asErr } = await supabase
            .from('event_assignees')
            .upsert(rows, { onConflict: 'event_id,profile_id', ignoreDuplicates: true })

        if (asErr) throw new Error(`Vložení nových assignees selhalo: ${asErr.message}`)
      }
    }

    await fetchEvents()
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return { events, loading, error, refetch: fetchEvents, createEvent, updateEvent, deleteEvent }
}