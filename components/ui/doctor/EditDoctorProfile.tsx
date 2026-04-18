'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CustomFormField from '@/components/CustomFormField'
import { Form, FormControl } from '../form'
import Image from 'next/image'
import SubmitButton from '@/components/SubmitButton'
import { FormFieldType } from '@/app/(root)/signin/SignUpForm'
import { SelectItem } from '../select'
import { useRouter } from 'next/navigation'
import z from 'zod'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod"
import { Resolver, useForm } from "react-hook-form"
import { DoctorFormValidation } from "@/lib/validation"
import FileUploader from "@/components/ui/FileUploader"
import AvatarUploader from '../AvatarUploader'
import { updateDoctor } from '@/lib/actions/doctor.actions'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Label } from '../label'
import { GenderOptions } from '@/constants'
import TagInputField from '@/components/TagInputField'

interface Props {
  doctorId: string
  user: {
    $id: string
    name: string
    email: string
    phone: string
  }
  doctor: {
    name: string
    phone: string
    email: string
    profilePic: string
    gender: string
    birthDate: string
    specialization: string
    qualification: string
    experience: string
    hospital: string
    address: string
    availableDays: string[]
    consultationHours: string
    consultationFee: string
    appointmentSpan: string
    about: string
    languages: string[]
    slotsAvailable: string[]
    earnedTotal: number
    identificationType: string
    updationConsent: boolean
    disclosureConsent: boolean
    privacyConsent: boolean
  }
}

type FormValues = z.infer<typeof DoctorFormValidation>

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 my-6">
    <div className="h-px flex-1 bg-gray-200" />
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
      {title}
    </span>
    <div className="h-px flex-1 bg-gray-200" />
  </div>
)

const ReadOnlyField = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="flex flex-col gap-1 w-full">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
    <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-gray-100 border border-gray-200">
      <Image src={icon} alt={label} height={18} width={18} className="opacity-40" />
      <span className="text-sm text-gray-500 font-mono">{value}</span>
    </div>
  </div>
)

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

const DoctorEditProfileModal = ({ doctorId, user, doctor }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(DoctorFormValidation) as Resolver<FormValues>,
    defaultValues: {
      name: doctor?.name ?? user.name ?? "",
      email: doctor?.email ?? user.email ?? "",
      phone: doctor?.phone ?? user.phone ?? "",
      profilePic: [],
      gender: (doctor?.gender as any) ?? "male",
      birthDate: doctor?.birthDate ? new Date(doctor.birthDate) : new Date(),
      specialization: doctor?.specialization ?? [],
      qualification: doctor?.qualification ?? [],
      experience: doctor?.experience ?? "",
      hospital: doctor?.hospital ?? "",
      address: doctor?.address ?? "",
      availableDays: (doctor?.availableDays as any) ?? [],
      consultationHours: doctor?.consultationHours ?? "",
      consultationFee: doctor?.consultationFee ?? "",
      appointmentSpan: doctor?.appointmentSpan ?? "",
      about: doctor?.about ?? "",
      languages: doctor?.languages ?? [],
      slotsAvailable: doctor?.slotsAvailable ?? [],
      earnedTotal: doctor?.earnedTotal ?? 0,
      identificationType: doctor?.identificationType ?? "",
      identificationDocument: [],
      updationConsent: doctor?.updationConsent ?? false,
      disclosureConsent: doctor?.disclosureConsent ?? false,
      privacyConsent: doctor?.privacyConsent ?? false,
    } as any as FormValues,
  })

  async function onSubmit(values: z.infer<typeof DoctorFormValidation>) {
          setLoading(true);
          let formData;
  
          if (values.identificationDocument && values.identificationDocument.length > 0) {
              const file = values.identificationDocument[0]
              formData = new FormData()
              formData.append('blobFile', file)
              formData.append('fileName', file.name)
          }
  
          try {
              const doctorData = {
                  userId: user.$id,
                  ...values,
                  birthDate: new Date(values.birthDate),
                  identificationDocument: formData,
              }
  
              // ✅ updatePatient instead of registerPatient
              const updated = await updateDoctor(doctorId, doctorData as any as RegisterDoctorParams)
  
              if (updated) {
                  setIsOpen(false)
                  router.refresh() // refresh dashboard data
              }
          } catch (error) {
              console.log('ERROR:', error)
          } finally {
              setLoading(false)
          }
      }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group items-center justify-center gap-1 border border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 h-8 px-4 rounded-full text-[11px] text-gray-600 font-medium text-nowrap mt-1 inline-flex bg-[#e1d7bc]"
      >
        <Image
          src='/assets/icons/edit-profile.svg'
          alt='edit profile'
          height={24}
          width={24}
          className='h-4'
        />
        <span>Edit Profile</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] w-fit max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">

          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                <Image src='/assets/icons/edit-profile.svg' alt='edit button' height={24} width={24} />
              </div>
              <div>
                <DialogTitle className="text-gray-900 font-semibold text-lg leading-tight">Edit Profile</DialogTitle>
                <p className="text-xs text-gray-400 mt-0.5">Update your professional and availability details</p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-gray-700">

                {/* ── Personal ── */}
                <SectionHeader title="Personal Information" />

                <div className="flex flex-col xl:flex-row gap-4 mt-2">
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
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="name"
                    label="Full Name"
                    iconSrc='/assets/icons/user.svg'
                    iconAlt="user"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                  <ReadOnlyField label="Email" value={user.email} icon="/assets/icons/email.svg" />
                  <ReadOnlyField label="Phone" value={user.phone} icon="/assets/icons/phone.svg" />
                </div>

                <div className="flex flex-col xl:flex-row gap-4 mt-2">
                  <CustomFormField
                    iconSrc='/assets/icons/calendar.svg'
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
                          className="flex h-11 gap-6 xl:justify-between"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          {GenderOptions.map((option) => (
                            <div key={option} className="radio-group radio-group-indicator bg-transparent">
                              <RadioGroupItem value={option} id={`edit-doc-${option}`} />
                              <Label htmlFor={`edit-doc-${option}`} className="cursor-pointer">{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    )}
                  />
                </div>

                {/* ── Professional ── */}
                <SectionHeader title="Professional Information" />

                <div className="flex flex-col xl:flex-row gap-4">
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="specialization"
                    label="Specialization"
                    placeholder="e.g. Cardiologist"
                  />
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="qualification"
                    label="Qualification"
                    placeholder="e.g. MBBS, MD"
                  />
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="experience"
                    label="Experience"
                    placeholder="e.g. 7 years"
                  />
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="hospital"
                    label="Hospital / Clinic"
                    placeholder="e.g. AIIMS Delhi"
                  />
                </div>

                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="address"
                  label="Address"
                  placeholder="Clinic or hospital address"
                />

                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="about"
                  label="About"
                  placeholder="Tell patients a bit about yourself..."
                />

                <CustomFormField
                  fieldType={FormFieldType.SKELETON}
                  control={form.control}
                  name="languages"
                  label="Languages Spoken"
                  renderSkeleton={(field: any) => (
                    <FormControl>
                      <TagInputField
                      label='Languages you know'
                        values={field.value}
                        onChange={field.onChange}
                        placeholder="Type a language and press Enter"
                      />
                    </FormControl>
                  )}
                />

                {/* ── Availability ── */}
                <SectionHeader title="Availability" />

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
                                const next = isSelected
                                  ? selected.filter((d) => d !== day)
                                  : [...selected, day]
                                field.onChange(next)
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                isSelected
                                  ? "bg-[#203C67] text-white border-[#203C67]"
                                  : "bg-white text-gray-500 border-gray-300 hover:border-[#203C67]"
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

                <div className="flex flex-col xl:flex-row gap-4">
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="consultationHours"
                    label="Consultation Hours"
                    placeholder="e.g. 9:00 AM - 5:00 PM"
                  />
                  <CustomFormField
                    fieldType={FormFieldType.INPUT}
                    control={form.control}
                    name="appointmentSpan"
                    label="Appointment Duration"
                    placeholder="e.g. 30 mins"
                  />
                </div>

                <CustomFormField
                  fieldType={FormFieldType.INPUT}
                  control={form.control}
                  name="consultationFee"
                  label="Consultation Fee (₹)"
                  placeholder="e.g. 500"
                />

                <CustomFormField
                  fieldType={FormFieldType.SKELETON}
                  control={form.control}
                  name="slotsAvailable"
                  label="Time Slots (e.g. 9:00 AM, 10:00 AM)"
                  renderSkeleton={(field: any) => (
                    <FormControl>
                      <TagInputField
                        values={field.value}
                        onChange={field.onChange}
                        placeholder='Type a slot like "9:00 AM" and press Enter'
                        validate={(val: string) => {
                          const valid = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(val)
                          return valid ? null : 'Enter a valid time slot (e.g. 9:00 AM)'
                        }}
                      />
                    </FormControl>
                  )}
                />

                {/* ── Identification ── */}
                <SectionHeader title="Identification & Verification" />

                <CustomFormField
                  fieldType={FormFieldType.SELECT}
                  control={form.control}
                  name="identificationType"
                  label="Identification Type"
                  placeholder="Select an identification type..."
                >
                  {["Aadhaar Card", "PAN Card", "Passport", "Medical License"].map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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

                {/* ── Consent ── */}
                <SectionHeader title="Consent & Privacy" />

                <CustomFormField fieldType={FormFieldType.CHECKBOX} control={form.control} name='updationConsent' label='I consent to updating my information' />
                <CustomFormField fieldType={FormFieldType.CHECKBOX} control={form.control} name='disclosureConsent' label='I consent to disclosure of information' />
                <CustomFormField fieldType={FormFieldType.CHECKBOX} control={form.control} name='privacyConsent' label='I consent to privacy policy' />

                {/* ── Actions ── */}
                <div className="flex gap-3 pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 h-10 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <SubmitButton isLoading={isLoading} className="flex-1 h-10 bg-[#203C67] hover:bg-[#2d5494] rounded-lg text-white text-sm font-medium transition-colors">
                    Save Changes
                  </SubmitButton>
                </div>

              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DoctorEditProfileModal