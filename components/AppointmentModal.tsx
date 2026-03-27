'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Button } from "./ui/button"
import { Appointment } from "@/types/appwrite"
import AppointmentForm from "./forms/AppointmentForm"

const AppointmentModal = ({type, patientId, userId, appointment}: { 
    type: 'schedule' | 'cancel'
    patientId: string,
    userId: string,
    appointment?: Appointment,
}) => {

    const [open, setOpen] = useState(false)


  return (
    <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        <Button variant='ghost' className={`capitalize ${type === 'schedule'? 'hover:text-green-500' : 'hover:text-red-300 text-gray-400'}`}>
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

        <AppointmentForm 
            userId={userId}
            patientId={patientId}
            type={type}
            appointment={appointment}
            setOpen={setOpen}
        />
    </DialogContent>
    </Dialog>
  )
}

export default AppointmentModal
