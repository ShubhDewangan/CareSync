export const GenderOptions = ['male','female','other','prefer not to say']

export const PatientFormDefaultValues = {
  name: "",
  email: "",
  phone: "",
  profilePic: '',
  birthDate: new Date(' '),
  gender: "male" as Gender,
  address: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  bloodGroup: '',
  height: '',
  weight: '',
  primaryDoctor: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  allergies: "",
  currentMedication: "",
  familyMedicalHistory: "",
  pastMedicalHistory: "",
  identificationType: "Birth Certificate",
  identificationNumber: "",
  identificationDocument: [],
  treatmentConsent: false,
  disclosureConsent: false,
  privacyConsent: false,
};

// Add this to constants/index.ts alongside PatientFormDefaultValues

export const DoctorFormDefaultValues = {
  name: "",
  email: "",
  phone: "",
  profilePic: [],
  gender: "male" as Gender,
  birthDate: new Date(),
  specialization: "",
  qualification: "",
  experience: "",
  hospital: "",
  address: "",
  availableDays: [] as string[],
  consultationHours: "",
  consultationFee: "0",
  appointmentSpan: "",
  about: "",
  languages: [] as string[],
  rating: 0,
  totalPatients: 0,
  identificationType: "Birth Certificate",
  identificationNumber: "",
  identificationDocument: [],
  slotsAvailable: [],
  earnedTotal: 0,
}

export const IdentificationTypes = [
  "Birth Certificate",
  "Driver's License",
  "Medical Insurance Card/Policy",
  // "Military ID Card",
  "Aadhar KYC",
  "Passport",
  // "Resident Alien Card (Green Card)",
  // "Social Security Card",
  // "State ID Card",
  "Student ID Card",
  "Voter ID Card",
];


export const StatusIcon = {
  scheduled: "/assets/icons/check.svg",
  pending: "/assets/icons/pending.svg",
  cancelled: "/assets/icons/cancelled.svg",
};