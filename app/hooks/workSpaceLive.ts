// lib/hooks/useWorkspaceLive.ts
"use client"

import { useEffect, useRef } from "react"

type LiveAppointment = {
  $id: string
  schedule: string
  status: string
  reason: string
  primaryDoctor: string
  patient: { $id: string; name: string } | null
  [key: string]: unknown
}

type LiveSlots = {
  blockedSlots: Record<string, string[]>
  bookedSlots: Record<string, string[]>
}

interface UseWorkspaceLiveOptions {
  doctorId: string
  onAppointments?: (appointments: LiveAppointment[]) => void
  onSlots?: (slots: LiveSlots) => void
}

export function useWorkspaceLive({ doctorId, onAppointments, onSlots }: UseWorkspaceLiveOptions) {
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!doctorId) return

    const es = new EventSource(`/api/doctors/live?doctorId=${doctorId}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)

        if (msg.type === "appointments" && onAppointments) {
          onAppointments(msg.data)
        }

        if (msg.type === "slots" && onSlots) {
          onSlots({
            blockedSlots: JSON.parse(msg.blockedSlots || "{}"),
            bookedSlots: JSON.parse(msg.bookedSlots || "{}"),
          })
        }
      } catch (err) {
        console.error("SSE parse error:", err)
      }
    }

    es.onerror = () => {
      es.close()
      // Reconnect after 3s
      setTimeout(() => {
        esRef.current = null
      }, 3000)
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [doctorId])
}