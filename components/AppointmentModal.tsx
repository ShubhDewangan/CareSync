/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Button } from "./ui/button"
import { Appointment } from "@/types/appwrite"
import { updateAppointment } from "@/lib/actions/appointment.actions" // adjust import

const AppointmentModal = ({ type, patientId, userId, appointment }: {
  type: 'schedule' | 'cancel'
  patientId: string
  userId: string
  appointment?: Appointment
}) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await updateAppointment({
        appointmentId: appointment?.$id as any,
        userId,
        appointment: {
          status: type === 'schedule' ? 'scheduled' : 'cancelled',
        },
        type,
      })
      setOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          className={`capitalize ${type === 'schedule' ? 'hover:text-green-500' : 'hover:text-red-300 text-gray-400'}`}
        >
          {type}
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog sm:max-w-md">
        <DialogHeader className="mb-4 space-y-3">
          <DialogTitle className="capitalize underline text-center">{type} Appointment</DialogTitle>
          <DialogDescription>
            Check these following details to {type} an appointment
          </DialogDescription>
        </DialogHeader>

        {/* Appointment summary */}
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <p><span className="font-medium">Patient:</span> {appointment?.patient?.name ?? 'N/A'}</p>
          <p><span className="font-medium">Doctor:</span> {appointment?.primaryDoctor ?? 'N/A'}</p>
          <p><span className="font-medium">Scheduled:</span> {appointment?.schedule ? new Date(appointment.schedule).toLocaleString() : 'N/A'}</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`mt-4 w-full capitalize ${type === 'schedule' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
        >
          {isLoading ? 'Processing...' : `Confirm ${type}`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default AppointmentModal