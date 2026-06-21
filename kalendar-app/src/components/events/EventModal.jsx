import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Search, Megaphone, Mail } from 'lucide-react'
import { format } from 'date-fns'

const AVATAR_COLORS = [
  'bg-teal',      'bg-blue',      'bg-purple-500', 'bg-pink-500',
  'bg-orange-500','bg-emerald-500','bg-cyan-500',  'bg-rose-500',
]

// Deterministická barva podle id — stejný člověk = stejná barva pokaždé.
function avatarColor(id) {
  if (!id) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function MemberAvatar({ profile, size = 'sm' }) {
  const initial = (profile.full_name || profile.email || '?').charAt(0).toUpperCase()
  const dims = size === 'sm' ? 'w-4 h-4 text-[9px]' : 'w-7 h-7 text-xs'
  return (
      <div className={`${dims} ${avatarColor(profile.id)} rounded-full flex items-center justify-center font-bold text-white uppercase shrink-0 ring-1 ring-white/10`}>
        {initial}
      </div>
  )
}

// Virtuální položka pro hromadné přiřazení — NENÍ to skutečný profil z DB
// (žádné profile.id), proto se nikdy neukládá do event_assignees. Místo
// toho nastavuje boolean sloupec events.notify_all (viz handleSubmit).
const ALL_OPTION = {
  id: '__all__',
  full_name: 'all',
  email: 'all@wenix.cz',
  isAllOption: true,
}

function AllOptionAvatar({ size = 'sm' }) {
  const dims = size === 'sm' ? 'w-4 h-4' : 'w-7 h-7'
  const iconSize = size === 'sm' ? 8 : 14
  return (
      <div className={`${dims} bg-gradient-to-br from-teal to-blue rounded-full flex items-center justify-center shrink-0 ring-1 ring-white/20`}>
        <Megaphone size={iconSize} className="text-white" strokeWidth={2.5} />
      </div>
  )
}

// Avatar pro ručně napsaný e-mail mimo profiles — obálka místo iniciály,
// protože u takového kontaktu neznáme jméno ani fotku.
function ExtraEmailAvatar({ size = 'sm' }) {
  const dims = size === 'sm' ? 'w-4 h-4' : 'w-7 h-7'
  const iconSize = size === 'sm' ? 8 : 14
  return (
      <div className={`${dims} bg-blue/30 rounded-full flex items-center justify-center shrink-0 ring-1 ring-blue/40`}>
        <Mail size={iconSize} className="text-blue" strokeWidth={2.5} />
      </div>
  )
}

/**
 * allEvents:    pole událostí ze Supabase (výstup useEvents().events)
 * allProfiles:  VŠICHNI registrovaní uživatelé (výstup useProfiles().profiles)
 *               — zdroj pravdy pro dropdown, protože allEvents ukáže jen
 *               lidi, kteří už mají nějakou událost.
 *
 * initialData (při editaci) má STEJNÝ tvar jako prvek z allEvents:
 *   { ..., event_assignees: [{ profile_id, profiles: { id, full_name, email, avatar_url } }] }
 */
export function EventModal({ isOpen, onClose, onSave, onDelete, selectedDate, initialData = null, allEvents = [], allProfiles = [] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [memberIds, setMemberIds] = useState([])      // profile.id[]
  const [notifyAll, setNotifyAll] = useState(false)   // true = "all" zvolena namísto konkrétních lidí
  const [extraEmails, setExtraEmails] = useState([])  // string[] — ručně napsané e-maily mimo profiles
  const [tags, setTags] = useState([])
  const [reminder, setReminder] = useState('1 den před')

  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [memberInput, setMemberInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [saveError, setSaveError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const membersRef = useRef(null)

  // DŮLEŽITÉ: dependency array sleduje jen isOpen a initialData?.id, ne celý
  // initialData objekt. Po každém uložení se zavolá fetchEvents() a Supabase
  // vrátí NOVÝ objekt se stejným obsahem, ale jinou referencí v paměti —
  // kdyby tu byla celá initialData, useEffect by se spustil znovu a přepsal
  // rozeditovaný start_time/end_time zpátky na starou hodnotu z DB.
  // Sledování pouze .id zajistí, že se formulář znovu naplní jen při otevření
  // modalu nebo přepnutí na editaci JINÉ události, ne při refetchi té samé.
  useEffect(() => {
    if (isOpen) {
      setSaveError(null)
      setTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      setMeetLink(initialData?.location_link || initialData?.meet_link || '')
      setReminder(initialData?.reminder || '1 den před')

      const isAllDayCheck = initialData?.is_all_day || (initialData?.start_time?.includes('00:01') && initialData?.end_time?.includes('23:59'))
      setIsAllDay(isAllDayCheck || false)

      // ── NEPRŮSTŘELNÁ extrakce přiřazených členů z relační tabulky ──
      const isNotifyAll = Boolean(initialData?.notify_all)
      setNotifyAll(isNotifyAll)

      let safeMemberIds = []
      if (!isNotifyAll) {
        const assignees = initialData?.event_assignees
        if (Array.isArray(assignees)) {
          safeMemberIds = assignees
              .map((a) => a?.profile_id || a?.profiles?.id)
              .filter(Boolean)
        }
      }
      setMemberIds(safeMemberIds)

      const safeExtraEmails = Array.isArray(initialData?.extra_emails)
          ? initialData.extra_emails.filter((e) => typeof e === 'string' && e.trim() !== '')
          : []
      setExtraEmails(safeExtraEmails)

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
  }, [isOpen, initialData?.id])

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

  // ── Sjednocení VŠECH dostupných profilů ──
  // 1. allProfiles = kompletní tabulka profiles (primární zdroj — obsahuje
  //    úplně každého registrovaného uživatele, i bez jediné události).
  // 2. allEvents[].event_assignees / allEvents[].profiles = doplňkový zdroj
  //    pro fallback, kdyby allProfiles ještě nedoletělo (loading stav).
  const profileMap = new Map()

  allProfiles.forEach((p) => {
    if (p?.id) profileMap.set(p.id, p)
  })

  allEvents.forEach((ev) => {
    const assignees = ev?.event_assignees
    if (Array.isArray(assignees)) {
      assignees.forEach((a) => {
        const profile = a?.profiles
        if (profile?.id && !profileMap.has(profile.id)) profileMap.set(profile.id, profile)
      })
    }
    const creator = ev?.profiles
    if (creator?.id && !profileMap.has(creator.id)) profileMap.set(creator.id, creator)
  })

  const AVAILABLE_PROFILES = Array.from(profileMap.values())
      .sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveError(null)

    let startIso, endIso

    if (isAllDay) {
      startIso = `${startStr.split('T')[0]}T00:01:00`
      endIso = `${endStr.split('T')[0]}T23:59:59`
    } else {
      startIso = `${startStr}:00`
      endIso = `${endStr}:00`
    }

    const eventData = {
      title,
      description,
      start_time: startIso,
      end_time: endIso,
      location_link: meetLink || null,
      reminder_minutes: reminderToMinutes(reminder),
      notify_all: notifyAll,
      // Pokud je zvolena hromadná notifikace, žádní jednotliví assignees
      // ani ručně napsané e-maily se neukládají — notify_all je jediný
      // zdroj pravdy a nemá smysl ho kombinovat s konkrétním seznamem.
      assigneeIds: notifyAll ? [] : memberIds,
      extra_emails: notifyAll ? [] : extraEmails,
    }

    if (initialData?.id) {
      eventData.id = initialData.id
    }

    setIsSaving(true)
    try {
      await onSave(eventData)
    } catch (err) {
      setSaveError(err?.message || 'Uložení se nezdařilo. Zkus to znovu.')
    } finally {
      setIsSaving(false)
    }
  }

  // Výběr "all" je vzájemně vylučující s konkrétními lidmi i ručně psanými
  // e-maily — vybrání "all" vždy vyprázdní obojí, aby v DB nikdy nešlo
  // notify_all=true SOUČASNĚ s naplněným event_assignees/extra_emails
  // (nejednoznačná sémantika "komu poslat e-mail").
  const toggleMember = (profileId) => {
    if (profileId === ALL_OPTION.id) {
      setNotifyAll((prev) => {
        const next = !prev
        if (next) {
          setMemberIds([])
          setExtraEmails([])
        }
        return next
      })
      return
    }

    setNotifyAll(false)
    setMemberIds(prev => prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId])
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function addExtraEmail(rawValue) {
    const value = rawValue.trim().toLowerCase()
    if (!value) return false
    if (!EMAIL_REGEX.test(value)) return false

    // Pokud zadaný e-mail patří existujícímu profilu, raději ho přidáme
    // jako skutečného člena (memberIds) — vyhneme se duplicitě stejného
    // člověka jednou v event_assignees a jednou v extra_emails.
    const matchingProfile = AVAILABLE_PROFILES.find((p) => (p.email || '').toLowerCase() === value)
    if (matchingProfile) {
      setNotifyAll(false)
      setMemberIds((prev) => prev.includes(matchingProfile.id) ? prev : [...prev, matchingProfile.id])
      return true
    }

    if (extraEmails.includes(value)) return false

    setNotifyAll(false)
    setExtraEmails((prev) => [...prev, value])
    return true
  }

  function removeExtraEmail(email) {
    setExtraEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleMemberInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const added = addExtraEmail(memberInput)
      if (added) setMemberInput('')
    }
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

  const extraEmailProfiles = extraEmails.map((email) => ({
    id: `extra:${email}`,
    full_name: null,
    email,
    isExtraEmail: true,
  }))

  const selectedProfiles = notifyAll
      ? [ALL_OPTION]
      : [
        ...memberIds.map(id => AVAILABLE_PROFILES.find(p => p.id === id)).filter(Boolean),
        ...extraEmailProfiles,
      ]

  // Filtrace zároveň podle jména i e-mailu (case-insensitive, diakritika
  // se neřeší — pro plné fulltextové vyhledávání by šlo doplnit normalizaci).
  const q = memberInput.trim().toLowerCase()
  const matchesQuery = (p) =>
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)

  // "all" je napevno přibitá jako první položka seznamu a zobrazuje se
  // i v rámci aktivního filtrování (požadavek: "vždy dostupná").
  const filteredProfiles = q === ''
      ? [ALL_OPTION, ...AVAILABLE_PROFILES]
      : (matchesQuery(ALL_OPTION) ? [ALL_OPTION] : []).concat(AVAILABLE_PROFILES.filter(matchesQuery))

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

            {/* ── Přiřazení členové — prémiový dropdown ── */}
            <div className="flex flex-col gap-1.5 relative" ref={membersRef}>
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Přiřazení členové</label>
              <div
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 min-h-[42px] cursor-pointer flex items-center flex-wrap gap-2 transition-colors hover:border-white/20"
              >
                {selectedProfiles.length === 0 && <span className="text-white/40 text-sm">Vyber členy týmu...</span>}
                {selectedProfiles.map(profile => {
                  const pillCls = profile.isAllOption
                      ? 'bg-teal/15 border-teal/30 text-teal'
                      : profile.isExtraEmail
                          ? 'bg-blue/15 border-blue/30 text-blue'
                          : 'bg-white/10 border-white/5 text-white'
                  return (
                      <div key={profile.id} className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 border ${pillCls}`}>
                        {profile.isAllOption
                            ? <AllOptionAvatar size="sm" />
                            : profile.isExtraEmail
                                ? <ExtraEmailAvatar size="sm" />
                                : <MemberAvatar profile={profile} size="sm" />}
                        {profile.full_name || profile.email}
                        <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (profile.isExtraEmail) removeExtraEmail(profile.email)
                              else toggleMember(profile.id)
                            }}
                            className="hover:text-red-400 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                  )
                })}
                <ChevronDown size={16} className={`text-white/40 ml-auto transition-transform duration-200 ${isMembersOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown panel — fade + slide nahoru při otevření */}
              <div
                  className={`absolute top-full left-0 right-0 mt-2 origin-top transition-all duration-150 ease-out z-20
                  ${isMembersOpen
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
              >
                <div className="bg-[#16161a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
                  <div className="relative border-b border-white/10">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                        onKeyDown={handleMemberInputKeyDown}
                        placeholder="Vyhledat nebo napsat e-mail a stisknout Enter..."
                        className="w-full bg-transparent text-white pl-9 pr-4 py-3 text-sm focus:outline-none placeholder:text-white/30"
                        onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {memberInput.trim() !== '' && filteredProfiles.length === 0 && (
                      <div className="px-4 pt-2 pb-1 -mt-1">
                      <span className={`text-xs ${EMAIL_REGEX.test(memberInput.trim().toLowerCase()) ? 'text-teal/80' : 'text-white/30'}`}>
                        {EMAIL_REGEX.test(memberInput.trim().toLowerCase())
                            ? 'Stiskni Enter pro přidání tohoto e-mailu'
                            : 'Napiš platný e-mail a stiskni Enter, nebo vyber ze seznamu'}
                      </span>
                      </div>
                  )}

                  <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                    {filteredProfiles.length === 0 && memberInput.trim() === '' && (
                        <div className="px-4 py-4 text-sm text-white/30 text-center">
                          Zatím žádní registrovaní členové
                        </div>
                    )}
                    {filteredProfiles.map((profile) => {
                      const isAllRow  = profile.isAllOption
                      const isSelected = isAllRow ? notifyAll : memberIds.includes(profile.id)
                      const showDivider = isAllRow && filteredProfiles.length > 1

                      return (
                          <div key={profile.id}>
                            <button
                                type="button"
                                onClick={() => toggleMember(profile.id)}
                                className={`w-full px-3 py-2.5 mx-1 rounded-lg text-sm flex items-center gap-3 transition-colors text-left
                                ${isAllRow
                                    ? (isSelected ? 'bg-teal/15 hover:bg-teal/20' : 'hover:bg-teal/10')
                                    : (isSelected ? 'bg-teal/10 hover:bg-teal/15' : 'hover:bg-white/[0.06]')}`}
                                style={{ width: 'calc(100% - 8px)' }}
                            >
                              {isAllRow ? <AllOptionAvatar size="md" /> : <MemberAvatar profile={profile} size="md" />}
                              <div className="flex flex-col min-w-0 flex-1">
                              <span className={`font-medium truncate ${isAllRow ? 'text-teal' : 'text-white/90'}`}>
                                {isAllRow ? 'Všichni (hromadné upozornění)' : (profile.full_name || '—')}
                              </span>
                                {profile.email && (
                                    <span className={`text-xs truncate ${isAllRow ? 'text-teal/60' : 'text-white/40'}`}>{profile.email}</span>
                                )}
                              </div>
                              <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-colors
                              ${isSelected ? 'bg-teal border-teal' : 'border-white/20'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black/80" />}
                              </div>
                            </button>
                            {showDivider && <div className="h-px bg-white/8 my-1 mx-3" />}
                          </div>
                      )
                    })}
                  </div>
                </div>
              </div>
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

          {saveError && (
              <div className="px-5 py-3 bg-red-500/10 border-t border-red-500/20 text-sm text-red-400">
                {saveError}
              </div>
          )}

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
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
              >
                {isSaving ? 'Ukládám...' : (initialData ? 'Uložit změny' : 'Vytvořit událost')}
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