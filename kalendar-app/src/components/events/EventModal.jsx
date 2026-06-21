import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

/**
 * allProfiles: [{ id, full_name, email, avatar_url }] — z useProfiles()
 * initialData.event_assignees: [{ profiles: { id, full_name, email, ... } }] — ze Supabase JOINu
 *
 * Members se v UI zobrazují jako e-maily (string[]), ale interně se vždy
 * mapují na profile.id, protože DB ukládá vztah přes event_assignees (M:N).
 */
export function EventModal({ isOpen, onClose, onSave, onDelete, selectedDate, initialData = null, allProfiles = [] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [memberIds, setMemberIds] = useState([])      // profile.id[]
  const [tags, setTags] = useState([])
  const [reminder, setReminder] = useState('1 den před')

  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [memberInput, setMemberInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const membersRef = useRef(null)

  // ── Pomocná mapa email <-> id, vždy odvozená z allProfiles ──
  const profileById    = Object.fromEntries(allProfiles.map(p => [p.id, p]))
  const profileByEmail = Object.fromEntries(allProfiles.map(p => [p.email, p]))

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      setMeetLink(initialData?.location_link || initialData?.meet_link || '')
      setReminder(initialData?.reminder || '1 den před')

      const isAllDayCheck = initialData?.is_all_day || (initialData?.start_time?.includes('00:01') && initialData?.end_time?.includes('23:59'))
      setIsAllDay(isAllDayCheck || false)

      // ── NEPRŮSTŘELNÁ extrakce přiřazených členů ──
      // Supabase JOIN tvar: event_assignees: [{ profiles: { id, email, ... } }]
      // Fallback pro starší/jiný tvar dat, kdyby modal dostal něco jiného.
      let safeMemberIds = []
      const assignees = initialData?.event_assignees
      if (Array.isArray(assignees)) {
        safeMemberIds = assignees
            .map((a) => a?.profiles?.id || a?.profile_id || a?.id)
            .filter(Boolean)
      }
      setMemberIds(safeMemberIds)

      let safeTags = []
      if (initialData?.tags) {
        const rawTags = Array.isArray(initialData.tags) ? initialData.tags : [initialData.tags]
        safeTags = rawTags
            .map(t => typeof t === 'object' && t !== null ? (t.name || t.title || String(t)) : String(t))
            .filter(t => t !== 'undefined' && t !== 'null' && t.trim() !== '')
      }
      setTags(safeTags)

      try {
        if (initialData?.start_time) {
          const d = new Date(initialData.start_time)
          setStartStr(isNaN(d.getTime()) ? format(new Date(), "yyyy-MM-dd'T'09:00") : format(d, "yyyy-MM-dd'T'HH:mm"))
        } else {
          const d = selectedDate ? new Date(selectedDate) : new Date()
          setStartStr(format(d, "yyyy-MM-dd'T'09:00"))
        }

        if (initialData?.end_time) {
          const d = new Date(initialData.end_time)
          setEndStr(isNaN(d.getTime()) ? format(new Date(), "yyyy-MM-dd'T'10:00") : format(d, "yyyy-MM-dd'T'HH:mm"))
        } else {
          const d = selectedDate ? new Date(selectedDate) : new Date()
          setEndStr(format(d, "yyyy-MM-dd'T'10:00"))
        }
      } catch (error) {
        console.error("Chyba při parsování data:", error)
      }
    }
  }, [isOpen, initialData, selectedDate])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (membersRef.current && !membersRef.current.contains(event.target)) {
        setIsMembersOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isOpen) return null

  // Seznam profilů k zobrazení v dropdownu — přímo z DB, žádné parsování undefined řetězců
  const AVAILABLE_PROFILES = allProfiles

  const handleSubmit = (e) => {
    e.preventDefault()

    let startIso, endIso

    if (isAllDay) {
      startIso = `${startStr.split('T')[0]}T00:01:00`
      endIso = `${endStr.split('T')[0]}T23:59:59`
    } else {
      startIso = `${startStr}:00`
      endIso = `${endStr}:00`
    }

    // DŮLEŽITÉ: "members" se NEPOSÍLÁ — tabulka events tento sloupec nemá.
    // Místo toho jde assigneeIds (profile.id[]), které hook useEvents
    // zapíše do vazební tabulky event_assignees.
    const eventData = {
      title,
      description,
      start_time: startIso,
      end_time: endIso,
      location_link: meetLink || null,
      reminder_minutes: reminderToMinutes(reminder),
      assigneeIds: memberIds,
    }

    if (initialData?.id) {
      eventData.id = initialData.id
    }

    onSave(eventData)
  }

  const toggleMember = (profileId) => {
    setMemberIds(prev => prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId])
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const selectedProfiles = memberIds.map(id => profileById[id]).filter(Boolean)
  const filteredProfiles = AVAILABLE_PROFILES.filter(p =>
      (p.email || '').toLowerCase().includes(memberInput.toLowerCase()) ||
      (p.full_name || '').toLowerCase().includes(memberInput.toLowerCase())
  )

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-[#0f0f11] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <h2 className="text-base font-bold text-white uppercase tracking-widest font-body">
              {initialData ? 'Upravit událost' : 'Nová událost'}
            </h2>
            <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-5 gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Název události</label>
              <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tk kruh deadline"
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Popis</label>
              <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detaily události..."
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between bg-[#161618] border border-white/10 rounded-lg p-3">
              <span className="text-sm font-semibold text-white/80 font-body">Celodenní akce</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal"></div>
              </label>
            </div>

            <div className="flex gap-4">
              <div className="flex-col gap-1.5 flex flex-1">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Začátek</label>
                <input
                    type={isAllDay ? "date" : "datetime-local"}
                    required
                    value={isAllDay ? startStr.split('T')[0] : startStr}
                    onChange={(e) => setStartStr(isAllDay ? `${e.target.value}T09:00` : e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex-col gap-1.5 flex flex-1">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Konec</label>
                <input
                    type={isAllDay ? "date" : "datetime-local"}
                    required
                    value={isAllDay ? endStr.split('T')[0] : endStr}
                    onChange={(e) => setEndStr(isAllDay ? `${e.target.value}T10:00` : e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Odkaz na schůzku</label>
              <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5 relative" ref={membersRef}>
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Přiřazení členové</label>
              <div
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 min-h-[42px] cursor-pointer flex items-center flex-wrap gap-2 transition-colors hover:border-white/20"
              >
                {selectedProfiles.length === 0 && <span className="text-white/40 text-sm">Vyber členy týmu...</span>}
                {selectedProfiles.map(profile => (
                    <div key={profile.id} className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/5">
                      <div className="w-4 h-4 bg-teal rounded-full text-[9px] flex items-center justify-center font-bold text-white uppercase">
                        {(profile.full_name || profile.email).charAt(0)}
                      </div>
                      {profile.full_name || profile.email}
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleMember(profile.id); }} className="hover:text-red-400 ml-1">
                        <X size={12} />
                      </button>
                    </div>
                ))}
                <ChevronDown size={16} className="text-white/40 ml-auto" />
              </div>

              {isMembersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 flex flex-col">
                    <input
                        type="text"
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                        placeholder="Vyhledat člena týmu..."
                        className="w-full bg-transparent border-b border-white/10 text-white px-4 py-3 text-sm focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredProfiles.length === 0 && (
                          <div className="px-4 py-3 text-sm text-white/30">Žádní členové k zobrazení</div>
                      )}
                      {filteredProfiles.map(profile => (
                          <div
                              key={profile.id}
                              onClick={() => toggleMember(profile.id)}
                              className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 cursor-pointer flex items-center gap-2"
                          >
                            <input type="checkbox" checked={memberIds.includes(profile.id)} readOnly className="accent-teal" />
                            <span>{profile.full_name || profile.email}</span>
                            <span className="text-white/30 text-xs ml-auto">{profile.email}</span>
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Štítky (Tagy)</label>
              <div className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 focus-within:border-teal transition-colors flex flex-wrap gap-2 items-center min-h-[42px]">
                {tags.map(tag => (
                    <div key={tag} className="bg-white/5 text-white/80 text-xs px-2.5 py-1 rounded-md flex items-center gap-1 border border-white/10">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-400">
                        <X size={12} />
                      </button>
                    </div>
                ))}
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Napiš tag a stiskni Enter..." : ""}
                    className="bg-transparent border-none text-white text-sm focus:outline-none flex-1 min-w-[120px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Upozornění</label>
              <select
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="15 minut před">15 minut před</option>
                <option value="1 hodina před">1 hodina před</option>
                <option value="1 den před">1 den před</option>
                <option value="Žádné">Žádné</option>
              </select>
            </div>

            <div className="pt-2"></div>
          </form>

          <div className="flex items-center justify-between p-5 border-t border-white/10 bg-[#0f0f11] shrink-0">
            {initialData ? (
                <button
                    type="button"
                    onClick={() => onDelete && onDelete(initialData.id)}
                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm font-medium transition-colors"
                >
                  Smazat
                </button>
            ) : <div></div>}

            <div className="flex gap-3">
              <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 text-sm font-medium transition-colors"
              >
                Zrušit
              </button>
              <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 text-sm font-semibold transition-colors"
              >
                {initialData ? 'Uložit změny' : 'Vytvořit událost'}
              </button>
            </div>
          </div>

        </div>
      </div>
  )
}

// Pomocná funkce — text reminder -> minuty pro DB sloupec reminder_minutes
function reminderToMinutes(label) {
  const map = {
    '15 minut před': 15,
    '1 hodina před': 60,
    '1 den před': 1440,
    'Žádné': 0,
  }
  return map[label] ?? 15
}