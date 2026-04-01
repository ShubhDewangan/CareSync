import { Models } from "node-appwrite";

export interface Patient extends Models.Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  birthDate: Date | undefined;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryDoctor: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies: string | undefined;
  currentMedication: string | undefined;
  familyMedicalHistory: string | undefined;
  pastMedicalHistory: string | undefined;
  identificationType: string | undefined;
  identificationDocumentationId: string | undefined;
  identificationDocumentUrl: string | undefined;
  identificationDocument: FormData | undefined;
  privacyConsent: boolean;
  disclosureConsent: boolean;
  treatmentConsent: boolean;
  registrationComplete?: boolean;
}

export interface Doctor {
  image: string
    name: string
    specialization: string
    experience: string
    qualification: string
    hospital: string
    address: string
    phone: string
    email: string
    availableDays: string[]
    consultationHours: string
    consultationFee: number
    rating: number
    totalPatients: number
    about: string
    languages: string[]
    gender: string
    appointmentSpan: string
}

export interface Appointment extends Models.Document {
  patient: Patient;
  schedule: Date;
  status: Status;
  primaryDoctor: string;
  reason: string;
  note: string;
  userId: string;
  cancellationReason: string | null;
}