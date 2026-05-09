// app/(protected)/alldoctors/[userId]/register/RegisterFormDoctor.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import CustomFormField from "@/components/CustomFormField";
import SubmitButton from "@/components/SubmitButton";
import { Form, FormControl } from "@/components/ui/form";
import calendarImage from "@/public/assets/icons/calendar.svg";
import mapImage from "@/public/assets/icons/map.svg";
import { DoctorFormValidation } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { FormFieldType } from "@/app/(root)/signin/SignUpForm";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DoctorFormDefaultValues, GenderOptions } from "@/constants";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import Image from "next/image";
import FileUploader from "@/components/ui/FileUploader";
import { Doctor } from "@/types/appwrite";
import { AuthUser } from "@/context/UserContext";
import AvatarUploader from "@/components/ui/AvatarUploader";
import { registerDoctor } from "@/lib/actions/doctor.actions";
import TagInputField from "@/components/TagInputField"; // ← new

type FormValues = z.infer<typeof DoctorFormValidation>;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const LANGUAGES = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Punjabi"]

// Suggestions for tag inputs (doctor can still type custom ones)
export const SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Neurologist", "Dermatologist",
  "Gynaecologist", "Paediatrician", "Orthopaedic", "Psychiatrist",
  "Ophthalmologist", "ENT Specialist", "Dentist", "Urologist",
  "Gastroenterologist", "Endocrinologist", "Surgeon", "Radiologist",
]
export const QUALIFICATIONS = ["MBBS", "MD", "MS", "BDS", "MDS", "DNB", "DM", "MCh", "FRCS", "MRCP"]
export const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "5:00 PM",
  "5:30 PM",
]


const ID_TYPES = ["Medical Council Registration", "Aadhaar Card", "PAN Card", "Passport", "Driving Licence"]

// ── Section Header ─────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col gap-1 border-b border-gray-300 pb-3 mt-4">
    <h2 className="text-[18px] font-semibold text-[#203C67] font-heading2">{title}</h2>
    {subtitle && <p className="text-[12px] text-gray-400">{subtitle}</p>}
  </div>
)

// ── Read-only display field ────────────────────────────────────────────────
const ReadOnlyField = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="flex flex-col gap-1 w-full">
    <span className="text-[13px] font-medium text-gray-600">{label}</span>
    <div className="bg-[#EFECE3] border flex items-center gap-2 font-mono border-gray-400 h-11 rounded-md px-3">
      <Image src={icon} alt={label} height={18} width={18} className="opacity-50" />
      <span className="text-sm truncate text-gray-600">{value}</span>
    </div>
  </div>
)

export const RegisterFormDoctor = ({ user, doctor }: {
  user: AuthUser
  doctor?: Doctor
}) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(DoctorFormValidation) as Resolver<FormValues>,
    defaultValues: {
      ...DoctorFormDefaultValues,
      name: doctor?.name ?? user?.name ?? "",
      email: doctor?.email ?? user?.email ?? "",
      phone: doctor?.phone ?? user?.phone ?? "",
      profilePic: [],
      birthDate: doctor?.birthDate ? new Date(doctor.birthDate) : new Date(),
      gender: (doctor?.gender as any) ?? "male",
      address: doctor?.address ?? "",
      // ── now arrays ──────────────────────────────────────────
      specialization: doctor?.specialization
        ? (Array.isArray(doctor.specialization) ? doctor.specialization : [doctor.specialization])
        : [],
      qualification: doctor?.qualification
        ? (Array.isArray(doctor.qualification) ? doctor.qualification : [doctor.qualification])
        : [],
      // ────────────────────────────────────────────────────────
      experience: doctor?.experience ?? "",
      hospital: doctor?.hospital ?? "",
      availableDays: doctor?.availableDays ?? [],
      consultationHours: doctor?.consultationHours ?? "",
      consultationFee: doctor?.consultationFee ?? '',
      appointmentSpan: doctor?.appointmentSpan ?? "",
      about: doctor?.about ?? "",
      languages: doctor?.languages ?? [],
      rating: doctor?.rating ?? 0,
      totalPatients: doctor?.totalPatients ?? 0,
      identificationType: doctor?.identificationType ?? "Birth Certificate",
      identificationDocument: [],
      updationConsent: doctor?.updationConsent ?? false,
      privacyConsent: doctor?.privacyConsent ?? false,
      disclosureConsent: doctor?.disclosureConsent ?? false,
      slotsAvailable: doctor?.slotsAvailable ? (Array.isArray(doctor.slotsAvailable) ? doctor.slotsAvailable : [doctor.slotsAvailable]) : [],
      earnedTotal: doctor?.earnedTotal ?? 0,
    } as FormValues,
  });

  async function onSubmit(values: z.infer<typeof DoctorFormValidation>) {
    setLoading(true)
    try {
      const doctorData = {
        identificationDocument: values.identificationDocument ?? [],
        userId: user?.$id,
        ...values,
        birthDate: new Date(values.birthDate),
        profilePic: values.profilePic,
        // arrays — Appwrite stores these natively when attribute is set to Array: true
        specialization: values.specialization,
        qualification: values.qualification,
      }
      const result = await registerDoctor(doctorData as unknown as RegisterDoctorParams)
      if (result) {
        router.push(`/alldoctors/${user?.$id}/work-space`)
      } else {
        throw new Error('Doctor registration failed')
      }
    } catch (error) {
      console.log('ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseConsultationHours = (value: string) => {
  const parts = value?.split(" - ")
  if (parts?.length === 2) {
    const toTime = (t: string) => {
      const [time, period] = t.trim().split(" ")
      // eslint-disable-next-line prefer-const
      let [h, m] = time.split(":").map(Number)
      if (period === "PM" && h !== 12) h += 12
      if (period === "AM" && h === 12) h = 0
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    }
    return { start: toTime(parts[0]), end: toTime(parts[1]) }
  }
  return { start: "09:00", end: "17:00" }
}

const formatTo12Hour = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

  return (
    <div className="min-h-screen bg-[#EFECE3] overflow-hidden xl:bg-transparent xl:relative">

      {/* Background — desktop only */}
      <Image
        src="/regBg.png"
        alt=" "
        fill
        className="object-cover hidden xl:block"
        priority
      />

      {/* Frosted card — desktop only */}
      <div className="hidden xl:block absolute inset-0">
        <div className="absolute inset-0 m-auto w-[90%] h-[90%] bg-[#cfc9b5]/85 shadow-2xl shadow-[#515141] rounded-[70px]" />
      </div>

      {/* Form container */}
      <div className="relative z-10 w-full px-4 py-8 xl:absolute xl:inset-0 xl:flex xl:items-center xl:justify-center">
        <div className="w-full xl:max-w-4xl xl:max-h-[85vh] xl:overflow-y-auto xl:remove-scrollbar xl:bg-transparent xl:px-12 xl:py-10">

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 text-gray-700">

              {/* Logo */}
              <Image
                src="/logo.png"
                alt="logo"
                height={1000}
                width={1000}
                className="block mx-auto h-16 xl:left-[150px] xl:absolute xl:h-20 w-fit"
              />

              {/* Title */}
              <section className="text-center flex flex-col items-center gap-1">
                <h1 className="text-[22px] font-semibold font-heading1">Doctor Registration</h1>
                <p className="text-[12px] text-gray-500"><i>Complete your profile to start accepting appointments</i></p>
              </section>

              {/* ── 1. Personal Information ───────────────────────────── */}
              <SectionHeader title="Personal Information" subtitle="Your basic identity details" />

              {/* Avatar + read-only fields */}
              <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6">
                <div className="flex-shrink-0">
                  <CustomFormField
                    fieldType={FormFieldType.SKELETON}
                    control={form.control}
                    name="profilePic"
                    label="Profile Picture"
                    renderSkeleton={(field: any) => (
                      <FormControl>
                        <AvatarUploader
                          files={field.value}
                          onChange={field.onChange}
                          defaultSrc="/assets/images/user_default.webp"
                        />
                      </FormControl>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <ReadOnlyField label="Full Name" value={user?.name ?? ""} icon="/assets/icons/user.svg" />
                  <div className="flex flex-col sm:flex-row gap-4">
                    <ReadOnlyField label="Email" value={user?.email ?? ""} icon="/assets/icons/email.svg" />
                    <ReadOnlyField label="Phone" value={user?.phone ?? ""} icon="/assets/icons/phone.svg" />
                  </div>
                </div>
              </div>

              {/* DOB + Gender */}
              <div className="flex flex-col xl:flex-row gap-4">
                <CustomFormField
                  iconSrc={calendarImage}
                  iconAlt="calendar"
                  fieldType={FormFieldType.DATEPICKER}
                  control={form.control}
                  name="birthDate"
                  label="Date of Birth"
                  time={false}
                />
                <CustomFormField
                  fieldType={FormFieldType.SKELETON}
                  control={form.control}
                  name="gender"
                  label="Gender"
                  renderSkeleton={(field: any) => (
                    <FormControl>
                      <RadioGroup
                        className="flex flex-wrap h-11 gap-6 xl:justify-between"
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        {GenderOptions.map((option) => (
                          <div key={option} className="radio-group radio-group-indicator bg-transparent">
                            <RadioGroupItem value={option} id={`doc-${option}`} />
                            <Label htmlFor={`doc-${option}`} className="cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </div>

              {/* Address */}
              <CustomFormField
                fieldType={FormFieldType.INPUT}
                control={form.control}
                name="address"
                label="Clinic / Hospital Address"
                iconSrc={mapImage}
                iconAlt="map"
                placeholder="123 MG Road, Mumbai"
              />

              {/* ── 2. Professional Details ───────────────────────────── */}
              <SectionHeader title="Professional Details" subtitle="Your medical qualifications and expertise" />

              {/* ── Specialization — tag input (replaces SELECT) ── */}
              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="specialization"
                label="Specialization"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <TagInputField
                      label="Specialization"
                      values={field.value ?? []}
                      onChange={field.onChange}
                      suggestions={SPECIALIZATIONS}
                      placeholder="Select or type a specialization..."
                      allowCustom={true}
                    />
                  </FormControl>
                )}
              />

              {/* ── Qualification — tag input (replaces SELECT) ── */}
              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="qualification"
                label="Qualifications"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <TagInputField
                      label="Qualifications"
                      values={field.value ?? []}
                      onChange={field.onChange}
                      suggestions={QUALIFICATIONS}
                      placeholder="Select or type a qualification..."
                      allowCustom={true}
                    />
                  </FormControl>
                )}
              />

              {/* Experience + Hospital */}
              <div className="flex flex-col xl:flex-row gap-4">
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="experience"
                  label="Years of Experience"
                  placeholder="e.g. 8 years"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="hospital"
                  label="Hospital / Clinic Name"
                  placeholder="e.g. AIIMS, Apollo, Fortis"
                />
              </div>

              {/* About */}
              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="about"
                label="About / Bio"
                placeholder="Brief description of your practice, expertise, and approach to patient care..."
              />

              {/* Languages */}
              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="languages"
                label="Languages Spoken"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((lang) => {
                        const selected: string[] = field.value ?? []
                        const isSelected = selected.includes(lang)
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                field.onChange(selected.filter((l: string) => l !== lang))
                              } else {
                                field.onChange([...selected, lang])
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
                              isSelected
                                ? "bg-[#203C67] text-white border-[#203C67]"
                                : "bg-white text-gray-600 border-gray-300 hover:border-[#203C67]"
                            }`}
                          >
                            {lang}
                          </button>
                        )
                      })}
                    </div>
                  </FormControl>
                )}
              />

              {/* ── 3. Availability & Fees ────────────────────────────── */}
              <SectionHeader title="Availability & Consultation" subtitle="When and how patients can reach you" />

              {/* Available days */}
              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="availableDays"
                label="Available Days"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const selected: string[] = field.value ?? []
                        const isSelected = selected.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                field.onChange(selected.filter((d: string) => d !== day))
                              } else {
                                field.onChange([...selected, day])
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
                              isSelected
                                ? "bg-[#8FABD4] text-[#203C67] border-[#203C67] font-semibold"
                                : "bg-white text-gray-600 border-gray-300 hover:border-[#8FABD4]"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                  </FormControl>
                )}
              />

              {/* Consultation hours + appointment span + fee */}
              <div className="flex flex-col xl:flex-row gap-4">
                {/* Consultation Hours */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">Consultation Hours</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400">Start time</label>
                      <input
                        type="time"
                        defaultValue={parseConsultationHours(form.getValues("consultationHours")).start}
                        onChange={(e) => {
                          const end = parseConsultationHours(form.getValues("consultationHours")).end
                          form.setValue(
                            "consultationHours",
                            `${formatTo12Hour(e.target.value)} - ${formatTo12Hour(end)}`
                          )
                        }}
                        className="border border-[#203C6740] rounded-lg px-3 py-2 text-[13px] bg-white/60 focus:outline-none focus:border-[#203C67] text-gray-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400">End time</label>
                      <input
                        type="time"
                        defaultValue={parseConsultationHours(form.getValues("consultationHours")).end}
                        onChange={(e) => {
                          const start = parseConsultationHours(form.getValues("consultationHours")).start
                          form.setValue(
                            "consultationHours",
                            `${formatTo12Hour(start)} - ${formatTo12Hour(e.target.value)}`
                          )
                        }}
                        className="border border-[#203C6740] rounded-lg px-3 py-2 text-[13px] bg-white/60 focus:outline-none focus:border-[#203C67] text-gray-800"
                      />
                    </div>
                  </div>
                  {/* live preview */}
                  <p className="text-[11px] text-gray-400 mt-1">
                    Saves as: {form.watch("consultationHours") || "9:00 AM - 5:00 PM"}
                  </p>
                </div>
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="appointmentSpan"
                  label="Appointment Duration"
                  placeholder="e.g. 30 mins"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="consultationFee"
                  label="Consultation Fee (₹)"
                  placeholder="e.g. 500"
                />
              </div>

              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="slotsAvailable"
                label="Slots Availability"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <TagInputField
                      label="Slots Availability"
                      values={field.value ?? []}
                      onChange={field.onChange}
                      suggestions={TIME_SLOTS}
                      placeholder="Select or type Time slots for your appointments..."
                      allowCustom={true}
                    />
                  </FormControl>
                )}
              />

              {/* ── 4. Identification ─────────────────────────────────── */}
              <SectionHeader title="Identification & Verification" subtitle="Upload your medical registration documents" />

              <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="identificationType"
                label="Identification Type"
                placeholder="Select document type"
              >
                {ID_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="text-black">{type}</SelectItem>
                ))}
              </CustomFormField>

              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="identificationDocument"
                label="Scanned copy of identification document"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <FileUploader files={field.value} onChange={field.onChange} />
                  </FormControl>
                )}
              />

              {/* ── 5. Consent ────────────────────────────────────────── */}
              <SectionHeader title="Consent & Privacy" />

              <CustomFormField
                fieldType={FormFieldType.CHECKBOX}
                control={form.control}
                name="updationConsent"
                label="I agree to keep my schedule updated and profile updated to not misguide patient"
              />
              <CustomFormField
                fieldType={FormFieldType.CHECKBOX}
                control={form.control}
                name="disclosureConsent"
                label="I consent to disclosure of my professional information to patients"
              />
              <CustomFormField
                fieldType={FormFieldType.CHECKBOX}
                control={form.control}
                name="privacyConsent"
                label="I agree to the privacy policy and terms of service"
              />

              <SubmitButton isLoading={isLoading} className="w-full h-11 bg-[#203C67] hover:bg-[#162d50] text-white rounded-lg mt-2">
                Complete Registration
              </SubmitButton>
              {Object.keys(form.formState.errors).length > 0 && (
                <pre className="text-red-500 text-xs bg-red-50 p-3 rounded">
                  {JSON.stringify(form.formState.errors, null, 2)}
                </pre>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};