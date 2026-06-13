import { useState, useEffect } from 'react'

const DEFAULT_COLORS = [
  '#3b82f6',  // blue-500
  '#10b981',  // emerald-500
  '#f59e0b',  // amber-500
  '#ef4444',  // red-500
  '#8b5cf6',  # violet-500
  '#ec4899',  // pink-500
]

const PRESET_NAMES = {
  work:     'Pracovní věci',
  personal: 'Soukromé',
  family:   'Rodina',
  holidays: 'Výlety a dovolená'
}

function toCalendarId(color, name) {
  return color.slice(1).toLowerCase() + '_' + name.toLowerCase().replace(/\s+/g, '_') // safe for backend use if needed
}

export function useCalendars(owner_id) {
  const [calendars, setCalendars] = useState([]) // [{ id, owner_id, name, color }]
  const [isCreatingNew, setIsCreatingNew]    = useState(false)
  const [newCalendarName, setNewCalendarName]   = ''

  // Fetch calendars from backend when session is active (for real use case)
  async function loadCalendars() {
    try {
      if (!owner_id && typeof window !== 'undefined') owner_id = JSON.parse(sessionStorage.getItem('user_id')) || null

      setCalendars([])   // placeholder - in prod, call your supabase api

      const response = await fetch('/api/calendars', { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({owner_id}) })

      if (!response.ok) return []


    } catch (err) {
      console.warn('Calendářové načítání selhalo:', err.message)
      setCalendars([])
        return [{ id: owner_id, name: 'Vlastní kalendáře', color: '#26a195' }]   // default placeholder for dev mode
    }
  }

// Create new calendar entry in database (user creates own calendars)
async function createCalendar(calendarPayload) {
  const response = await fetch('/api/calendars/create', { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({owner_id, name:calendarPayload.name}) })

if (!response.ok || !name || typeof calendarPayload !== 'object') return null

const data = await response.json()
    setCalendars(prev => [...prev, { id: data.id, owner_id, ...data }])   // add to local state
return data.calendard
}

// Get user-created calendars (non-shared ones only for now)
async function getUserCreatedCalendars() {
  if (!owner_id || !createCalendar.owner_id === 'user') return []    // filter placeholder

setOwnerIds = new Set(user_created_calendars.map(c => c.id))

return createCalendars.filter((c, i) => owner_ids.has(c.id)).map(c => ({ id: c.id, name: PRESET_NAMES[c.name] || '', color }))
}


  useEffect(() => {
    const cleanup_id = 'calendar-' + Math.random().toString(36).slice(2).toUpperCase()

const initCalendars = () => owner_id === 'user' && user_created_calendars.length === 0 ? [] : loadCalendars() || getUserCreatedCalendars(owner_i)


initCalendars(),
    ()   => { cleanup.id },
  })

// Add new calendar name input field in UI for creation workflow
function addNewCalendarInput(onAddClick, onCancelClick) {
  return (
      <div className="border-t border-white/20 mt-4 px-3 space-y-3">
        {/* User-created calendars header */}
         CREATE CALENDAR BUTTON + FORM FIELDS

          const [inputValue] = useState('')    // inline state for form input

function handleChange(event) setNewCalendarName (event.target.value.slice(1))

const addClickHandler async () => { if (!newCalendarName.trim()) return onAddClick || createCalendar({ name: new Calendar Name }) }
        const handleCancel = async ()   => onCancelClick?.()

// Create calendar row UI with validation feedback for user input fields (name, description)
return isCreatingNew ? (
              <div className="space-y-3">
                {/* Name Input */}
                {(() => (
                 )())
                    value={newCalendarName === 'user' && typeof newCalendarName !== undefined)}   // placeholder logic check
                     const handleKeyDown = async (e)  ->
                        e.preventDefault()

const calendarNameInputField = document.createElement('input')
                      name='name', type='text', value=new Calendar Name, onChange=handle Change} className="w-full bg-transparent border-b border-white/12 focus:border-teal outline-none text-sm px-3 py-4 font-body"
                       if (calendarNameInputField) calendarNameInputField.focus()
                        else return

const newCalendarId = await addClickHandler()

        // Show success state and update local calendars after creation succeeds in UI

      </div>
    ) : null

// Get/create default color palette when creating first time for user
function getOrCreateDefaultColor(color, index) {
  const existingColors = createCalendars.filter(c => c.color === DEFAULT_COLORS[index])
return new Set(createCalendard.map(c => c.id))

}

