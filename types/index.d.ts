
declare type SearchParamProps = {
  params: Promise<{ [key: string]: string }>
  searchParams: Promise<{ [key: string]: string[] | undefined }>
}
declare type Gender = "male" | "female" | "other" | "prefer not to say";
declare type Status = "pending" | "scheduled" | "cancelled" | 'Appointment Expired' | 'Completed';
declare type Week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

declare interface CreateUserParams {
  name: string;
  email: string;
  phone: string;
}
declare interface User extends CreateUserParams {
  $id: string;
  userType: 'patient' | 'doctor'
}

declare interface RegisterUserParams extends CreateUserParams {
  profilePic: File[] | undefined
  userId: string;
  birthDate: Date | unknown;
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
  // identificationNumber: string | undefined;
  identificationDocument: FormData | undefined;
  treatmentConsent: boolean;
  disclosureConsent: boolean;
  privacyConsent: boolean;
}

declare type CreateAppointmentParams = {
  userId: string;
  patient: string;
  primaryDoctor: string;
  reason: string;
  schedule: Date;
  status: Status;
  note: string | undefined;
};

declare type UpdateAppointmentParams = {
  appointmentId: string;
  userId: string;
  appointment: Appointment;
  type: string;
};

declare interface CreateDoctorParams {
  name: string;
  email: string;
  phone: string;
}

// Add this to types/index.d.ts — replace existing RegisterDoctorParams

declare interface RegisterDoctorParams {
  // from auth — links to Appwrite user
  userId: string

  // from signup — already collected
  name: string
  email: string
  phone: string

  // personal
  profilePic: File[] | undefined
  gender: Gender
  birthDate: Date

  // professional
  specialization: string
  qualification: string
  experience: string
  hospital: string
  address: string

  // availability
  availableDays: string[]
  consultationHours: string
  consultationFee: string
  appointmentSpan: string

  // about
  about: string
  languages: string[]

  // rating + patients — auto-set to 0 on registration
  rating: number
  totalPatients: number

  identificationType: string | undefined;
  // identificationNumber: string | undefined;
  identificationDocument: File[] | undefined;

  privacyConsent: boolean
  updationConsent: boolean
  disclosureConsent: boolean

  slotsAvailable: string[]
  earnedTotal: number
}