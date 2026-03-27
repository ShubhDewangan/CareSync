'use server'

import { Appointment } from "@/types/appwrite";
// import { InputFile } from "node-appwrite/file";
import { APPOINTMENT_COLLECTION_ID, DATABASE_ID, databases } from "../appwrite.config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
// import { parseStringify } from "../utils";

export const createAppointment = async (appointment: CreateAppointmentParams) => {
    try {
        const newAppointment = await databases.createDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            ID.unique(),
            {...appointment}
        )

        console.log('patient value being saved:', appointment.patient)
        
        return JSON.parse(JSON.stringify(Object.assign({}, newAppointment)));
    } catch (error) {
        console.log(error)
    }
}

export const getAppointment = async (appointmentId: string) => {
    try {
        const appointment = await databases.getDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            appointmentId
        )
        return JSON.parse(JSON.stringify(Object.assign({}, appointment)))
    } catch (error) {
        console.log(error)
    }
}

export const recentAppointments = async () => {
    try {
        const appointments = await databases.listDocuments(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            [
                Query.orderDesc('$createdAt'),
                Query.select(['*', 'patient.*'])  // 👈 populate patient
            ]
        )

        const initialCounts = {
            scheduledCount: 0,
            pendingCount: 0,
            cancelledCount: 0
        }

        const counts = (appointments.documents as unknown as Appointment[]).reduce((acc, appointment) => {
            if (appointment.status === 'scheduled') {
                acc.scheduledCount += 1
            } else if (appointment.status === 'pending') {
                acc.pendingCount += 1;
            } else if (appointment.status === 'cancelled') {
                acc.cancelledCount += 1;
            }

            return acc
        }, initialCounts) 

        const data = {
            totalCount: appointments.total,
            ...counts,
            documents: appointments.documents.map(doc => {
                const plainDoc = Object.assign({}, doc)
                if (plainDoc.patient) {
                    plainDoc.patient = Object.assign({}, plainDoc.patient)
                }
                return JSON.parse(JSON.stringify(plainDoc))
            })
        }
        // console.log('first doc patient:', appointments.documents[0]?.patient)

        return {
            ...data
        }

    } catch (error) {
        console.log(error);
        
    }
}

export const updateAppointment = async ({appointmentId, appointment}: UpdateAppointmentParams) => {
    try {
        const updatedAppointment = await databases.updateDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            appointmentId,
            appointment
        )

        if (!updatedAppointment) {
            throw new Error('Appointment not found')
        }
        

        //SMS notification

        revalidatePath('/admin')
        return JSON.parse(JSON.stringify(Object.assign({}, updatedAppointment)))
        
    } catch (error) {
        console.log(error);
        
    }
}