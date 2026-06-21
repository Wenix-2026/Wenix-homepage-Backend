import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

// Předpřipravený seznam členů - 'all@wenix.cz' je teď hned na prvním místě
const AVAILABLE_MEMBERS = ['all@wenix.cz', 'auersvald', 'martinek', 'vilem', 'david', 'martin']

export function EventModal({ isOpen, onClose, onSave, onDelete, selectedDate, initialData = null }) {
  // Stavy formuláře
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [members, setMembers] = useState([]) // Zde držíme pole textů
  const [tags, setTags] = useState([])
  const [reminder, setReminder] = useState('1 den před')

  // UI stavy pro našeptávače a tagy
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const membersRef = useRef(null)

  // Naplnění dat při otevření
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      setIsAllDay(initialData?.is_all_day || false)
      setMeetLink(initialData?.meet_link || '')

      // Zajištění, že members a tags jsou vždy pole, i když z databáze přijde null
      setMembers(initialData?.members ? (Array.isArray(initialData.members) ? initialData.members : [initialData.members]) : [])
      setTags(initialData?.tags ? (Array.isArray(initialData.tags) ? initialData.tags : [initialData.tags]) : [])
      setReminder(initialData?.reminder || '1 den před')

      // Formátování data pro inputy
      if (initialData?.start_time) {
        setStartStr(format(new Date(initialData.start_time), initialData.is_all_day ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"))
      } else {
        const d = selectedDate ? new Date(selectedDate) : new Date()
        setStartStr(format(d, "yyyy-MM-dd'T'09:00"))
      }

      if (initialData?.end_time) {
        setEndStr(format(new Date(initialData.end_time), initialData.is_all_day ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"))
      } else {
        const d = selectedDate ? new Date(selectedDate) : new Date()
        setEndStr(format(d, "yyyy-MM-dd'T'10:00"))
      }
    }
  }, [isOpen, initialData, selectedDate])

  // Zavření dropdownu při kliknutí jinam
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

  const handleSubmit = (e) => {
    e.preventDefault()

    let startIso, endIso

    // Logika pro celodenní akce vs přesný čas
    if (isAllDay) {
      // Input date vrací jen 'yyyy-mm-dd', natvrdo přidáme časy
      startIso = `${startStr.split('T')[0]}T00:01:00`
      endIso = `${endStr.split('T')[0]}T23:59:59`
    } else {
      startIso = `${startStr}:00`
      endIso = `${endStr}:00`
    }

    // Čistý objekt pro Supabase - members a tags jsou zaručeně čistá pole stringů
    const eventData = {
      ...initialData,
      title,
      description,
      is_all_day: isAllDay,
      start_time: startIso,
      end_time: endIso,
      meet_link: meetLink,
      members: members,
      tags: tags,
      reminder
    }

    onSave(eventData)
  }

  // Práce se členy (přidání / odebrání)
  const toggleMember = (member) => {
    setMembers(prev =>
        prev.includes(member)
            ? prev.filter(m => m !== member)
            : [...prev, member]
    )
  }

  // Práce s tagy (přidání přes Enter)
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-[#0f0f11] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* Hlavička */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <h2 className="text-base font-bold text-white uppercase tracking-widest font-body">
              {initialData ? 'Upravit událost' : 'Nová událost'}
            </h2>
            <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Formulář - scrolluje, pokud je moc dlouhý */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-5 gap-5">

            {/* Název */}
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

            {/* Popis */}
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

            {/* Přepínač celodenní akce */}
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

            {/* Časy */}
            <div className="flex gap-4">
              <div className="flex-col gap-1.5 flex flex-1">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Začátek</label>
                <input
                    type={isAllDay ? "date" : "datetime-local"}
                    required
                    value={startStr}
                    onChange={(e) => setStartStr(e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex-col gap-1.5 flex flex-1">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Konec</label>
                <input
                    type={isAllDay ? "date" : "datetime-local"}
                    required
                    value={endStr}
                    onChange={(e) => setEndStr(e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal transition-colors text-sm dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Odkaz */}
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

            {/* Přiřazení členové - Custom Multi-select */}
            <div className="flex flex-col gap-1.5 relative" ref={membersRef}>
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Přiřazení členové</label>
              <div
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg px-3 py-2.5 min-h-[42px] cursor-pointer flex items-center flex-wrap gap-2 transition-colors hover:border-white/20"
              >
                {members.length === 0 && <span className="text-white/40 text-sm">Vyber členy...</span>}
                {members.map(member => (
                    <div key={member} className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/5">
                      <div className="w-4 h-4 bg-teal rounded-full text-[9px] flex items-center justify-center font-bold text-white uppercase">
                        {member.charAt(0)}
                      </div>
                      {member}
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleMember(member); }} className="hover:text-red-400 ml-1">
                        <X size={12} />
                      </button>
                    </div>
                ))}
                <ChevronDown size={16} className="text-white/40 ml-auto" />
              </div>

              {/* Dropdown se členy */}
              {isMembersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
                    {AVAILABLE_MEMBERS.map(member => (
                        <div
                            key={member}
                            onClick={() => toggleMember(member)}
                            className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 cursor-pointer flex items-center gap-2"
                        >
                          <input type="checkbox" checked={members.includes(member)} readOnly className="accent-teal" />
                          <span className={member === 'all@wenix.cz' ? 'font-bold text-teal-400' : ''}>{member}</span>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Štítky (Tagy) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Štítky (Tagy)</label>
              <div className="w-full bg-[#161618] border border-white/10 rounded-lg px-3 py-2 focus-within:border-teal transition-colors flex flex-wrap gap-2 items-center min-h-[42px]">
                {tags.map(tag => (
                    <div key={tag} className="bg-white/5 text-white/80 text-xs px-2.5 py-1 rounded-md flex items-center gap-1 border border-white/10">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
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

            {/* Upozornění */}
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

            {/* Odsazení před tlačítky */}
            <div className="pt-2"></div>
          </form>

          {/* Patička s tlačítky */}
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