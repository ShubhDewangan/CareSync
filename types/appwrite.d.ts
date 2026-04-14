import { Models } from "node-appwrite";

export interface Patient extends Models.Document {
  $id: string
  userId: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string | undefined;
  birthDate: Date | undefined;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  bloodGroup: string
  weight: string
  height: string
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
  $id: string;
  name: string;
  email: string;
  phone: string;
  profilePic?: string;           // Appwrite file ID
  birthDate: string;             // ISO date string
  gender: "male" | "female" | "other";
  address: string;
  specialization: string;
  qualification: string;
  experience: string;
  hospital: string;
  availableDays: string[];       // e.g. ["Mon","Tue","Wed"]
  consultationHours: string;
  consultationFee: number;
  appointmentSpan: string;       // e.g. "30 mins"
  about: string;
  languages: string[];
  rating: number;
  totalPatients: number;
  identificationType: string;
  identificationDocument?: string;
  updationConsent: boolean;
  privacyConsent: boolean;
  disclosureConsent: boolean;
  // extras you may add to Appwrite collection:
  proceduresPerformed?: number;
  patientSatisfaction?: number;
  yearsInPractice?: number;
  nextAvailable?: string;
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