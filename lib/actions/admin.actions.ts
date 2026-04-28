// lib/actions/admin.actions.ts
'use server'

import { Query } from "node-appwrite"
import {
  databases,
  DATABASE_ID,
  PATIENT_COLLECTION_ID,
  DOCTOR_COLLECTION_ID,
  APPOINTMENT_COLLECTION_ID,
} from "../appwrite.config"
import { decryptKey, parseStringify } from "../utils"

// ============================
// 📊 QUICK STATS
// ============================
// Returns all numbers needed for the admin stat cards in one call
export const getAdminStats = async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = tomorrow.toISOString()

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoISO = weekAgo.toISOString()

    // Run all queries in parallel
    const [
      patients,
      doctors,
      appointmentsToday,
      pendingAppointments,
      scheduledAppointments,
      cancelledAppointments,
      cancelledThisWeek,
      newPatientsToday,
      newDoctorsToday,
    ] = await Promise.all([
      // Total patients
      databases.listDocuments(DATABASE_ID!, PATIENT_COLLECTION_ID!, [
        Query.limit(1),
      ]),
      // Total doctors
      databases.listDocuments(DATABASE_ID!, DOCTOR_COLLECTION_ID!, [
        Query.limit(1),
      ]),
      // Appointments today
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.greaterThanEqual("schedule", todayISO),
        Query.lessThan("schedule", tomorrowISO),
        Query.limit(1),
      ]),
      // Pending appointments (all time)
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal("status", ["pending"]),
        Query.limit(1),
      ]),
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('status', ['scheduled']),
        Query.limit(1),
      ]),
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('status', ['cancelled']),
        Query.limit(1),
      ]),
      // Cancelled this week
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal("status", ["cancelled"]),
        Query.greaterThanEqual("$createdAt", weekAgoISO),
        Query.limit(1),
      ]),
      // New patients today
      databases.listDocuments(DATABASE_ID!, PATIENT_COLLECTION_ID!, [
        Query.greaterThanEqual("$createdAt", todayISO),
        Query.limit(1),
      ]),
      // New doctors today
      databases.listDocuments(DATABASE_ID!, DOCTOR_COLLECTION_ID!, [
        Query.greaterThanEqual("$createdAt", todayISO),
        Query.limit(1),
      ]),
    ])

    return {
      totalPatients: patients.total,
      totalDoctors: doctors.total,
      appointmentsToday: appointmentsToday.total,
      pendingAppointments: pendingAppointments.total,
      scheduledAppointments: scheduledAppointments.total,
      cancelledAppointments: cancelledAppointments.total,
      cancelledThisWeek: cancelledThisWeek.total,
      newPatientsToday: newPatientsToday.total,
      newDoctorsToday: newDoctorsToday.total,
    }
  } catch (error) {
    console.log("getAdminStats error:", error)
    return {
      totalPatients: 0,
      totalDoctors: 0,
      appointmentsToday: 0,
      pendingAppointments: 0,
      scheduledAppointments: 0,
      cancelledAppointments: 0,
      cancelledThisWeek: 0,
      newPatientsToday: 0,
      newDoctorsToday: 0,
    }
  }
}

// ============================
// 📅 APPOINTMENTS THIS WEEK
// ============================
// Returns count per day for the bar chart (last 7 days)

export const getWeeklyAppointments = async () => {
  try {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - i)

      const next = new Date(day)
      next.setDate(next.getDate() + 1)

      const result = await databases.listDocuments(
        DATABASE_ID!,
        APPOINTMENT_COLLECTION_ID!,
        [
          Query.greaterThanEqual("schedule", day.toISOString()),
          Query.lessThan("schedule", next.toISOString()),
          Query.limit(1),
        ]
      )

      days.push({
        day: day.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }), // Mon, Tue etc
        date: day.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
        count: result.total,
      })
    }

    return days
  } catch (error) {
    console.log("getWeeklyAppointments error:", error)
    return []
  }
}

// ============================
// 👥 RECENT PATIENTS
// ============================
// Latest 10 registered patients for the registrations table

export const getRecentPatients = async () => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(10),
      ]
    )

    return result.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      createdAt: doc.$createdAt,
    }))
  } catch (error) {
    console.log("getRecentPatients error:", error)
    return []
  }
}

// ============================
// 🩺 RECENT DOCTORS
// ============================
// Latest 10 registered doctors

export const getRecentDoctors = async () => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(10),
      ]
    )

    return result.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      name: doc.name,
      email: doc.email,
      specialization: doc.specialization,
      profilePic: doc.profilePic,
      createdAt: doc.$createdAt,
    }))
  } catch (error) {
    console.log("getRecentDoctors error:", error)
    return []
  }
}

// ============================
// 📋 ALL ADMIN DATA (combined)
// ============================
// Single call for the admin dashboard page
// Fetches everything in parallel

export const getAdminDashboardData = async () => {
  try {
    const [stats, weeklyAppointments, recentPatients, recentDoctors, appointments] =
      await Promise.all([
        getAdminStats(),
        getWeeklyAppointments(),
        getRecentPatients(),
        getRecentDoctors(),
        // recentAppointments already exists in appointment.actions.ts — reuse it
        databases.listDocuments(
          DATABASE_ID!,
          APPOINTMENT_COLLECTION_ID!,
          [
            Query.orderDesc("$createdAt"),
            Query.limit(10),
            Query.select(['*', 'patient.*']),
          ]
        ),
      ])

    return {
      stats,
      weeklyAppointments,
      recentPatients,
      recentDoctors,
      recentAppointments: appointments.documents.map((doc) => {
        const plainDoc = Object.assign({}, doc)
        if (plainDoc.patient) {
          plainDoc.patient = Object.assign({}, plainDoc.patient)
        }
        return parseStringify(plainDoc)
      }),
    }
  } catch (error) {
    console.log("getAdminDashboardData error:", error)
    return null
  }
}