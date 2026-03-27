/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps, Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import CustomFormField from "../CustomFormField";
// import { Button } from "@/components/ui/button"
import SubmitButton from "@/components/SubmitButton";
// import { Label } from "@/components/ui/label"
import { Form, FormControl } from "@/components/ui/form";

import userImage from "@/public/assets/icons/user.svg";
import emailImage from "@/public/assets/icons/email.svg";
import calendarImage from "@/public/assets/icons/calendar.svg";
import mapImage from "@/public/assets/icons/map.svg";
import { PatientFormValidation } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { createUser, getPatient, registerPatient } from "@/lib/actions/patient.actions";
import { FormFieldType } from "./PatientForm";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Doctors, GenderOptions, IdentificationTypes, PatientFormDefaultValues } from "@/constants";
import { Label } from "../ui/label";
import { SelectItem } from "../ui/select";

import Image from 'next/image'
import FileUploader from "../ui/FileUploader";
import { Patient } from "@/types/appwrite";

// import userDataToRegisterDirectory from "./PatientForm";

type FormValues = z.infer<typeof PatientFormValidation>;

export const RegisterForm = ({ user, patient }: { 
  user: User
  patient?: Patient
}) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);
  // console.log(userDataToRegisterDirectory);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(PatientFormValidation) as Resolver<FormValues>,
    defaultValues: {
      ...PatientFormDefaultValues,
      name: patient?.name ?? user.name ?? "",
      email: patient?.email ?? user.email ?? "",
      phone: patient?.phone ?? user.phone ?? "",
      birthDate: patient?.birthDate ? new Date(patient.birthDate) : new Date(),
      gender: patient?.gender ?? "male",
      address: patient?.address ?? "",
      occupation: patient?.occupation ?? "",
      emergencyContactName: patient?.emergencyContactName ?? "",
      emergencyContactNumber: patient?.emergencyContactNumber ?? "",
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

// In RegisterForm onSubmit
  async function onSubmit(values: z.infer<typeof PatientFormValidation>) {
      setLoading(true);
      let formData;

      // console.log('1. values:', values)
      // console.log('2. identificationDocument:', values.identificationDocument)

      if (values.identificationDocument && values.identificationDocument.length > 0) {
          const file = values.identificationDocument[0]
          // console.log('3. file:', file)
          
          formData = new FormData()
          formData.append('blobFile', file)
          formData.append('fileName', file.name)
          // console.log('4. formData:', formData.get('blobFile'), formData.get('fileName'))
      }

      try {
          const patientData = {
              userId: user.$id,
              ...values,
              birthDate: new Date(values.birthDate),
              identificationDocument: formData,
          }

          // console.log('5. patientData:', patientData)

          const patient = await registerPatient(patientData as RegisterUserParams)
          // console.log('6. patient:', patient)

          if (patient) router.push(`/patients/${user.$id}/dashboard`)
      } catch (error) {
          console.log('ERROR:', error)
      } finally {
          setLoading(false)
      }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 flex-1 overflow-y-auto overflow-x-hidden text-gray-700"
      >
        <section className="mb-12 space-y-4 text-(--secondary) text-center flex flex-col justify-center items-center">
          <h1 className="header font-heading1">Register Yourself</h1>
          <p className="text-dark-500">
            Let us know more for better connection!
          </p>
        </section>

        <section className="space-y-6">
          <div className="mb-9 space-y-1">
            <h2 className="sub-header font-heading2">Personal Information</h2>
          </div>
        </section>

        <div>
        <h3>Full Name</h3>
        <div className="mt-2 shad-input w-full border flex items-center gap-2 font-mono border-gray-600 h-11 rounded-md">
          <Image
            src='/assets/icons/user.svg'
            alt="usericon"
            height={24}
            width={24}
            className='ml-2'
          />
          {user.name}
        </div>
        </div>

        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
        <div className="w-1/2">
        <h3>Email</h3>
        <div className="mt-2 shad-input border flex items-center gap-2 font-mono border-gray-600 h-11 rounded-md">
          <Image
            src='/assets/icons/email.svg'
            alt="usericon"
            height={24}
            width={24}
            className='ml-2'
          />
          {user.email}
        </div>
        </div>
        <div className="w-1/2">
        <h3>Phone</h3>
        <div className="mt-2 shad-input  border flex items-center gap-2 font-mono border-gray-600 h-11 rounded-md">
          <Image
            src='/assets/icons/phone.svg'
            alt="usericon"
            height={24}
            width={24}
            className='ml-2'
          />
          {user.phone}
        </div>
        </div></div>


        {/* <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          label="Full name"
          iconSrc={userImage}
          iconAlt="User Icon"
          placeholder="John Doe"
          disabled={true}
        />

        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="email"
            label="Email"
            iconSrc={emailImage}
            iconAlt="Email Icon"
            placeholder="johndoe@example.com"
            disabled={true}
          />
          <CustomFormField
            fieldType={FormFieldType.PHONE_INPUT}
            control={form.control}
            name="phone"
            label="Phone Number"
            // iconSrc={phoneImage}
            iconAlt="Phone Icon"
            placeholder="(+91) 2345678910 "
            disabled={true}
          />
        </div> */}
        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
          <CustomFormField
            iconSrc={calendarImage}
            iconAlt="calender"
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
                  className="flex h-11 gap-6 xl:justify-between"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  {GenderOptions.map((option) => (
                    <div
                      key={option}
                      className="radio-group radio-group-indicator bg-transparent"
                    >
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          />
        </div>

        <div className="flex flex-col gap-10 xl:flex-row object-fit overflow-hidden">
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
          /></div>

        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
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
            // iconSrc={phoneImage}
            iconAlt="Phone Icon"
            placeholder="(+91) 2345678911"
          />
        </div>

        <section className="space-y-6">
          <div className="my-9 space-y-1">
            <h2 className="sub-header font-heading2">Medical Information</h2>
          </div>
        </section>

        <CustomFormField
            fieldType={FormFieldType.SELECT}
            control={form.control}
            name="primaryDoctor"
            label="Primary Physician"
            // iconSrc={phoneImage}
            placeholder="Select a Physician"
          >
            {Doctors.map((doctor) => (
              <SelectItem key={doctor.name} value={doctor.name} className="w-full">
                <div className="flex cursor-pointer items-center gap-5 ml-2">
                  <Image
                    src={doctor.image}
                    width={32}
                    height={32}
                    alt={doctor.name}
                    className='rounded-full border border-dark-500'
                  />
                  <p>{doctor.name}</p>
                </div>
              </SelectItem>
            ))}
          </CustomFormField>

        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
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

        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
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
        
        <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
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
            name="medicalHistory"
            label="Past Medical History"
            placeholder="e.g. Fracture, etc."
          />
          </div>

        <section className="space-y-6">
          <div className="my-9 space-y-1">
            <h2 className="sub-header font-heading2">Identification and Verification</h2>
          </div>
        </section>

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
                <FileUploader files={field.value} onChange={field.onChange}/>
              </FormControl>
            )}
          />

          <section className="space-y-6">
          <div className="my-9 space-y-6">
            <h2 className="sub-header font-heading2">Consent and Privacy</h2>
          </div>
        </section>

        <CustomFormField
          fieldType={FormFieldType.CHECKBOX}
          control={form.control}
          name='treatmentConsent'
          label='I consent to treatment'
          />

        <CustomFormField
          fieldType={FormFieldType.CHECKBOX}
          control={form.control}
          name='disclosureConsent'
          label='I consent to disclosure of Information'
          />
        
        <CustomFormField
          fieldType={FormFieldType.CHECKBOX}
          control={form.control}
          name='privacyConsent'
          label='I consent to privacy policy'
          />

        <div className="flex gap-3 pt-2 w-full items-center justify-center  ">
          {/* <Button type="button" className="w-2/5" variant="outline" onClick={() => form.reset()}>
              Reset
            </Button> */}
          <SubmitButton
            isLoading={isLoading}
            className="w-full h-10 bg-green-500"
          >
            Register
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
