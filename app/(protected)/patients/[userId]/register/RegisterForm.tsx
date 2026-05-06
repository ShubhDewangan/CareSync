// app/(protected)/patients/[userId]/register/RegisterForm.tsx
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
import userImage from "@/public/assets/icons/user.svg";
import calendarImage from "@/public/assets/icons/calendar.svg";
import mapImage from "@/public/assets/icons/map.svg";
import { PatientFormValidation } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { registerPatient } from "@/lib/actions/patient.actions";
import { FormFieldType } from "@/app/(root)/signin/SignUpForm";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GenderOptions, IdentificationTypes, PatientFormDefaultValues } from "@/constants";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import Image from "next/image";
import FileUploader from "@/components/ui/FileUploader";
import { Patient } from "@/types/appwrite";
import { AuthUser } from "@/context/UserContext";
import AvatarUploader from "@/components/ui/AvatarUploader";

type FormValues = z.infer<typeof PatientFormValidation>;

export const RegisterForm = ({ user, patient, doctors }: {
  user: AuthUser
  patient?: Patient
  doctors: any
}) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(PatientFormValidation) as Resolver<FormValues>,
    defaultValues: {
      ...PatientFormDefaultValues,
      name: patient?.name ?? user?.name ?? "",
      email: patient?.email ?? user?.email ?? "",
      phone: patient?.phone ?? user?.phone ?? "",
      birthDate: patient?.birthDate ? new Date(patient.birthDate) : new Date(),
      gender: patient?.gender ?? "male",
      address: patient?.address ?? "",
      occupation: patient?.occupation ?? "",
      emergencyContactName: patient?.emergencyContactName ?? "",
      emergencyContactNumber: patient?.emergencyContactNumber ?? "",
      bloodGroup: patient?.bloodGroup ?? '',
      weight: patient?.weight ?? '',
      height: patient?.height ?? '',
      primaryDoctor: patient?.primaryDoctor ?? "",
      insuranceProvider: patient?.insuranceProvider ?? "",
      insurancePolicyNumber: patient?.insurancePolicyNumber ?? "",
      allergies: patient?.allergies ?? "",
      currentMedication: patient?.currentMedication ?? "",
      familyMedicalHistory: patient?.familyMedicalHistory ?? "",
      pastMedicalHistory: patient?.pastMedicalHistory ?? "",
      identificationType: patient?.identificationType ?? "",
      treatmentConsent: patient?.treatmentConsent ?? false,
      disclosureConsent: patient?.disclosureConsent ?? false,
      privacyConsent: patient?.privacyConsent ?? false,
    } as FormValues,
  });

  async function onSubmit(values: z.infer<typeof PatientFormValidation>) {
  setLoading(true)
  let formData

  if (values.identificationDocument && values.identificationDocument.length > 0) {
    const file = values.identificationDocument[0]
    formData = new FormData()
    formData.append('blobFile', file)
    formData.append('fileName', file.name)
  }

  try {
    const patientData = {
      userId: user?.$id,
      ...values,
      birthDate: new Date(values.birthDate),
      identificationDocument: formData,
      profilePic: values.profilePic,  // ← pass as File[] directly
    }

    const patient = await registerPatient(patientData as RegisterUserParams)
    if (patient) {
      router.push(`/patients/${user?.$id}/dashboard`)
    } else {
      throw new Error('Patient registration failed')
    }
  } catch (error) {
    console.log('ERROR:', error)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-[#EFECE3] overflow-hidden xl:bg-transparent xl:relative">

      {/* Background image — desktop only */}
      <Image
        src="/regBg.png"
        alt=" "
        fill
        className="object-cover hidden xl:block"
        priority
      />

      {/* Frosted card — desktop only */}
      <div className="hidden xl:block absolute inset-0 items-center justify-center">
        <div className="absolute inset-0 m-auto w-[90%] h-[90%] bg-[#cfc9b5]/85 shadow-2xl shadow-[#515141] rounded-[70px]" />
      </div>

      {/* Form container */}
      <div className="
        relative z-10
        w-full px-4 py-8
        xl:absolute xl:inset-0 xl:flex xl:items-center xl:justify-center
      ">
        <div className="
          w-full
          xl:max-w-4xl xl:max-h-[85vh] xl:overflow-y-auto xl:remove-scrollbar
          xl:bg-transparent xl:px-12 xl:py-10
        ">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6 text-gray-700"
            >

              {/* Logo — hidden on mobile */}
              <Image
                src="/logo.png"
                alt="logo"
                height={1000}
                width={1000}
                className="block mx-auto h-16 xl:left-[150px] xl:absolute xl:h-20 w-fit"
              />

              {/* Title */}
              <section className="text-center flex flex-col items-center gap-2 -translate-y-5">
                <h1 className="text-[20px] font-medium font-heading1">Register Yourself</h1>
                <p className="text-[12px] text-dark-500"><i>Let us know more for better connection!</i></p>
              </section>

              {/* ── Personal Info ─────────────────────────────────── */}
              <h2 className="text-black text-[20px] font-heading2 border-b border-gray-400 pb-2">
                Personal Information
              </h2>

              {/* Avatar + Name + Email + Phone */}
              <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6">

                {/* Avatar */}
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

                {/* Name + Email + Phone */}
                <div className="flex flex-col gap-4 w-full">
                  <div>
                    <h3 className="font-medium mb-2">Full Name</h3>
                    <div className="bg-[#EFECE3] w-full border flex items-center gap-2 font-mono border-gray-600 h-11 rounded-md px-2">
                      <Image src="/assets/icons/user.svg" alt="user" height={24} width={24} />
                      <span className="text-sm truncate">{user?.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">Email</h3>
                      <div className="bg-[#EFECE3] border flex items-center gap-2 font-mono border-gray-600 h-11 rounded-md px-2">
                        <Image src="/assets/icons/email.svg" alt="email" height={24} width={24} />
                        <span className="text-sm truncate">{user?.email}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">Phone</h3>
                      <div className="bg-[#EFECE3] border flex items-center gap-2 font-mono border-gray-600 h-11 rounded-md px-2">
                        <Image src="/assets/icons/phone.svg" alt="phone" height={24} width={24} />
                        <span className="text-sm truncate">{user?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DOB + Gender */}
              <div className="flex flex-col xl:flex-row gap-6">
                <CustomFormField
                  iconSrc={calendarImage}
                  iconAlt="calendar"
                  fieldType={FormFieldType.DATEPICKER}
                  control={form.control}
                  name="birthDate"
                  label="Date of Birth"
                />
                <CustomFormField
                  fieldType={FormFieldType.SKELETON}
                  control={form.control}
                  name="gender"
                  label="Gender"
                  renderSkeleton={(field: any) => (
                    <FormControl>
                      <RadioGroup
                        className="flex flex-wrap xl:flex-nowrap h-11 gap-6 xl:justify-between "
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        {GenderOptions.map((option) => (
                          <div key={option} className="radio-group radio-group-indicator bg-transparent">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </div>

              {/* Address + Occupation */}
              <div className="flex flex-col xl:flex-row gap-4 xl:mt-0 mt-[50px]">
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="address"
                  label="Address"
                  iconSrc={mapImage}
                  iconAlt="map"
                  placeholder="GB Road, Delhi"
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="occupation"
                  label="Occupation"
                  placeholder="Prime Minister of America"
                />
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col xl:flex-row gap-4">
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="emergencyContactName"
                  iconSrc={userImage}
                  iconAlt="Name"
                  label="Emergency Contact Name"
                  placeholder="Father, Mother, Siblings, friend"
                />
                <CustomFormField
                  fieldType={FormFieldType.PHONE_INPUT}
                  control={form.control}
                  name="emergencyContactNumber"
                  label="Emergency Contact Number"
                  iconAlt="Phone Icon"
                  placeholder="(+91) 2345678911"
                />
              </div>

              <h2 className="text-black text-[20px] font-heading2 border-b border-gray-400 pb-2 mt-2">
                Vitals
              </h2>

              <div className="flex gap-10">
                <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="bloodGroup"
                label="Blood Group"
                placeholder="your blood group"
              >
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((bloodGroup) => (
                  <SelectItem key={bloodGroup} value={bloodGroup} className="w-full">
                    <div className="flex cursor-pointer items-center gap-5 ml-2">
                      <p className="text-black">{bloodGroup}</p>
                    </div>
                  </SelectItem>
                ))}
              </CustomFormField>

              <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="weight" label="Weight" units="Kg" placeholder="your Weight?"/>

              <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name='height' label='Height' units="cm" placeholder="your height?"/>
              </div>

              {/* ── Medical Info ──────────────────────────────────── */}
              <h2 className="text-black text-[20px] font-heading2 border-b border-gray-400 pb-2 mt-2">
                Medical Information
              </h2>

              <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="primaryDoctor"
                label="Primary Doctor"
                placeholder="Select a Doctor"
              >
                {doctors.map((doctor: any) => (
                  <SelectItem key={doctor.name} value={doctor.name} className="w-full">
                    <div className="flex cursor-pointer items-center gap-5 ml-2">
                      <Image
                        src={doctor.profilePic}
                        width={32}
                        height={32}
                        alt={doctor.name}
                        className="rounded-full border border-dark-500"
                      />
                      <p className='text-black'>{doctor.name}</p>
                    </div>
                  </SelectItem>
                ))}
              </CustomFormField>

              <div className="flex flex-col xl:flex-row gap-6">
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="insuranceProvider"
                  label="Insurance Provider"
                  placeholder="e.g. HDFC ERGO, LIC, Acko, etc."
                />
                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="insurancePolicyNumber"
                  label="Insurance Policy Number"
                  placeholder="ABC123456789"
                />
              </div>

              <div className="flex flex-col xl:flex-row gap-6">
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="allergies"
                  label="Allergies (If any)"
                  placeholder="e.g. Peanuts, Penicillin, Pollen"
                />
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="currentMedication"
                  label="Current Medication (If any)"
                  placeholder="e.g. Paracetamol"
                />
              </div>

              <div className="flex flex-col xl:flex-row gap-6">
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="familyMedicalHistory"
                  label="Family Medical History"
                  placeholder="e.g. Diabetes, etc."
                />
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="pastMedicalHistory"
                  label="Past Medical History"
                  placeholder="e.g. Fracture, etc."
                />
              </div>

              {/* ── Identification ────────────────────────────────── */}
              <h2 className="text-black text-[20px] font-heading2 border-b border-gray-400 pb-2 mt-2">
                Identification and Verification
              </h2>

              <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="identificationType"
                label="Identification Type"
                iconSrc={userImage}
                placeholder="Select an identification type..."
              >
                {IdentificationTypes.map((type) => (
                  <SelectItem key={type} value={type} className="w-full">
                    {type}
                  </SelectItem>
                ))}
              </CustomFormField>

              <CustomFormField
                fieldType={FormFieldType.SKELETON}
                control={form.control}
                name="identificationDocument"
                label="Scanned copy of identification docs"
                renderSkeleton={(field: any) => (
                  <FormControl>
                    <FileUploader files={field.value} onChange={field.onChange} />
                  </FormControl>
                )}
              />

              {/* ── Consent ───────────────────────────────────────── */}
              <h2 className="text-black text-[20px] font-heading2 border-b border-gray-400 pb-2 mt-2">
                Consent and Privacy
              </h2>

              <CustomFormField
                fieldType={FormFieldType.CHECKBOX}
                control={form.control}
                name="treatmentConsent"
                label="I consent to treatment"
              />
              <CustomFormField
                fieldType={FormFieldType.CHECKBOX}
                control={form.control}
                name="disclosureConsent"
                label="I consent to disclosure of Information"
              />
              <CustomFormField
                fieldType={FormFieldType.CHECKBOX}
                control={form.control}
                name="privacyConsent"
                label="I consent to privacy policy"
              />

              <SubmitButton text='pushing your data...' isLoading={isLoading} className="w-full h-10 bg-green-500">
                Register
              </SubmitButton>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};