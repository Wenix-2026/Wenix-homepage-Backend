import { useState } from 'react'
import { TopBar }             from './TopBar'
import { MonthView }          from './MonthView'
import { WeekView }           from './WeekView'
import { DayView }            from './DayView'
import { EventModal }         from '../events/EventModal'
import { EventDetailModal }   from '../events/EventDetailModal'
import { useCalendar }        from '../../hooks/useCalendar'
import { useEvents }          from '../../hooks/useEvents'

export function CalendarDashboard() {
    const cal = useCalendar()
    const { events, createEvent, updateEvent, deleteEvent } = useEvents(cal.year, cal.month)

    const [createModal, setCreateModal] = useState({ open: false, date: null })
    const [editModal,   setEditModal]   = useState({ open: false, event: null })
    const [detailModal, setDetailModal] = useState({ open: false, event: null })

    function openCreate(date = null)  { setCreateModal({ open: true, date }) }

    // OPRAVA: Při otevření úprav se musí detail události zavřít
    function openEdit(event) {
        setDetailModal({ open: false, event: null })
        setEditModal({ open: true, event })
    }

    function openDetail(event) { setDetailModal({ open: true, event }) }

    // OPRAVA: Modal posílá jen jeden parametr (payload), takže si ID musíme vytáhnout z něj
    async function handleSave(payload) {
        if (payload.id) {
            await updateEvent(payload.id, payload)
            setEditModal({ open: false, event: null }) // Zavřít modal po úpravě
        } else {
            await createEvent(payload)
            setCreateModal({ open: false, date: null }) // Zavřít modal po vytvoření
        }
    }

    return (
        <div className="h-screen w-full max-w-[100vw] flex flex-col bg-white text-black dark:bg-surface-900 dark:text-white transition-colors duration-200 overflow-hidden">
            <TopBar cal={cal} onNewEvent={() => openCreate()} />

            <main className="flex flex-1 overflow-hidden">
                {cal.view === 'month' && (
                    <MonthView
                        cal={cal}
                        events={events}
                        onDayClick={(day) => openCreate(day)}
                        onEventClick={openDetail}
                    />
                )}
                {cal.view === 'week' && (
                    <WeekView
                        cal={cal}
                        events={events}
                        onSlotClick={(day) => openCreate(day)}
                        onEventClick={openDetail}
                    />
                )}
                {cal.view === 'day' && (
                    <DayView
                        cal={cal}
                        events={events}
                        onSlotClick={(day) => openCreate(day)}
                        onEventClick={openDetail}
                    />
                )}
            </main>

            {/* OPRAVA: Přejmenováno open na isOpen a initialDate na selectedDate */}
            {/* Vytvářecí modal */}
            <EventModal
                isOpen={createModal.open}
                onClose={() => setCreateModal({ open: false, date: null })}
                onSave={handleSave}
                onDelete={deleteEvent}
                selectedDate={createModal.date}
                allEvents={events}
            />

            {/* Upravovací modal */}
            <EventModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, event: null })}
                onSave={handleSave}
                onDelete={deleteEvent}
                initialData={editModal.event}
                allEvents={events}
            />

            {/* Detail modal */}
            <EventDetailModal
                open={detailModal.open}
                onClose={() => setDetailModal({ open: false, event: null })}
                event={detailModal.event}
                onEdit={openEdit}
            />
        </div>
    )
}