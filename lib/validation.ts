import * as z from "zod"

// ─── Auth ───────────────────────────────────────────────────────────────────

export const RegisterFormValidation = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be at most 50 characters."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits.")
    .max(15, "Phone number must be at most 15 digits.")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number."),
})

// Step 1: User enters email → OTP is sent
export const OtpRequestValidation = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
})

// Step 2: User enters the OTP they received
export const OtpVerifyValidation = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits.")
    .regex(/^\d{6}$/, "OTP must contain only numbers."),
})

// ─── Patient ─────────────────────────────────────────────────────────────────

export const PatientFormValidation = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits.")
    .max(15, "Phone number must be at most 15 digits.")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number."),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be at most 50 characters."),
  birthDate: z.coerce.date(),
  gender: z.enum(["male", "female", "other", "prefer not to say"]),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be at most 500 characters"),
  occupation: z
    .string()
    .min(2, "Occupation must be at least 2 characters")
    .max(500, "Occupation must be at most 500 characters"),
  emergencyContactName: z
    .string()
    .min(2, "Contact name must be at least 2 characters")
    .max(50, "Contact name must be at most 50 characters"),
  emergencyContactNumber: z
    .string()
    .refine(
      (val) => /^\+\d{10,15}$/.test(val),
      "Invalid phone number — must include country code (e.g. +91...)"
    ),
  primaryDoctor: z.string().min(2, "Select at least one doctor"),
  insuranceProvider: z
    .string()
    .min(2, "Insurance name must be at least 2 characters")
    .max(50, "Insurance name must be at most 50 characters"),
  insurancePolicyNumber: z
    .string()
    .min(2, "Policy number must be at least 2 characters")
    .max(50, "Policy number must be at most 50 characters"),
  allergies: z.string().optional(),
  currentMedication: z.string().optional(),
  familyMedicalHistory: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  identificationType: z.string().optional(),
  identificationDocument: z.custom<File[]>().optional(),
  treatmentConsent: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "You must consent to treatment in order to proceed",
    }),
  disclosureConsent: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "You must consent to disclosure in order to proceed",
    }),
  privacyConsent: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "You must consent to privacy in order to proceed",
    }),
})

// ─── Appointments ────────────────────────────────────────────────────────────

export const CreateAppointmentSchema = z.object({
  primaryDoctor: z.string().min(2, "Select at least one doctor"),
  schedule: z.coerce.date(),
  reason: z
    .string()
    .min(2, "Reason must be at least 2 characters")
    .max(500, "Reason must be at most 500 characters"),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
})

export const ScheduleAppointmentSchema = z.object({
  primaryDoctor: z.string().min(2, "Select at least one doctor"),
  schedule: z.coerce.date(),
  reason: z.string().optional(),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
})

export const CancelAppointmentSchema = z.object({
  primaryDoctor: z.string().min(2, "Select at least one doctor"),
  schedule: z.coerce.date(),
  reason: z.string().optional(),
  note: z.string().optional(),
  cancellationReason: z
    .string()
    .min(2, "Reason must be at least 2 characters")
    .max(500, "Reason must be at most 500 characters"),
})

export function getAppointmentSchema(type: string) {
  switch (type) {
    case "create":
      return CreateAppointmentSchema
    case "cancel":
      return CancelAppointmentSchema
    default:
      return ScheduleAppointmentSchema
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type RegisterFormValues  = z.infer<typeof RegisterFormValidation>
export type OtpRequestValues    = z.infer<typeof OtpRequestValidation>
export type OtpVerifyValues     = z.infer<typeof OtpVerifyValidation>
export type PatientFormValues   = z.infer<typeof PatientFormValidation>