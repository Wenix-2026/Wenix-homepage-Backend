import { useState } from 'react'
import { TopBar }             from './TopBar'
import { MonthView }          from './MonthView'
import { WeekView }           from './WeekView'
import { DayView }            from './DayView'
import { EventModal }         from '../events/EventModal'
import { EventDetailModal }   from '../events/EventDetailModal'
import { useCalendar }        from '../../hooks/useCalendar'
import { useEvents }          from '../../hooks/useEvents'
import { useProfiles }        from '../../hooks/useProfiles'

export function CalendarDashboard() {
    const cal = useCalendar()
    const { events, createEvent, updateEvent, deleteEvent } = useEvents(cal.year, cal.month)
    const { profiles: allProfiles } = useProfiles()

    const [createModal, setCreateModal] = useState({ open: false, date: null })
    const [editModal,   setEditModal]   = useState({ open: false, event: null })
    const [detailModal, setDetailModal] = useState({ open: false, event: null })

    function openCreate(date = null)  { setCreateModal({ open: true, date }) }
    function openEdit(event) { setDetailModal({ open: false, event: null }); setEditModal({ open: true, event }) }
    function openDetail(event) { setDetailModal({ open: true, event }) }

    async function handleSave(payload) {
        if (payload.id) {
            await updateEvent(payload.id, payload)
            setEditModal({ open: false, event: null })
        } else {
            await createEvent(payload)
            setCreateModal({ open: false, date: null })
        }
    }

    return (
        <div className="h-screen w-full flex flex-col bg-[#0f0f11] text-white">
            <TopBar cal={cal} onNewEvent={() => openCreate()} />
            <main className="flex flex-1 overflow-hidden">
                {cal.view === 'month' && <MonthView cal={cal} events={events} onDayClick={openCreate} onEventClick={openDetail} />}
                {cal.view === 'week' && <WeekView cal={cal} events={events} onSlotClick={openCreate} onEventClick={openDetail} />}
                {cal.view === 'day' && <DayView cal={cal} events={events} onSlotClick={openCreate} onEventClick={openDetail} />}
            </main>

            <EventModal
                isOpen={createModal.open}
                onClose={() => setCreateModal({ open: false, date: null })}
                onSave={handleSave}
                onDelete={deleteEvent}
                selectedDate={createModal.date}
                allEvents={events}
                allProfiles={allProfiles}
            />
            <EventModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, event: null })}
                onSave={handleSave}
                onDelete={deleteEvent}
                initialData={editModal.event}
                allEvents={events}
                allProfiles={allProfiles}
            />
            <EventDetailModal open={detailModal.open} onClose={() => setDetailModal({ open: false, event: null })} event={detailModal.event} onEdit={openEdit} />
        </div>
    )
}