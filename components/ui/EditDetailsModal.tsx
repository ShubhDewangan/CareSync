'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CustomFormField from '../CustomFormField'
import { Form, FormControl } from './form'
import Image from 'next/image'
import SubmitButton from '../SubmitButton'
import { FormFieldType } from '../../app/(root)/signin/SignUpForm'
import { SelectItem } from './select'
import { GenderOptions } from '@/constants'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Label } from './label'
import { updatePatient } from '@/lib/actions/patient.actions'
import { PatientFormValidation } from '@/lib/validation'
import { useRouter } from 'next/navigation'
import z from 'zod'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { Resolver, useForm } from "react-hook-form";
import mapImage from "@/public/assets/icons/map.svg";
import { IdentificationTypes, PatientFormDefaultValues } from "@/constants";
import FileUploader from "../ui/FileUploader";
import AvatarUploader from './AvatarUploader'
import { getAllDoctors } from '@/lib/actions/doctor.actions'
import { Doctor } from '@/types/appwrite'

interface Props {
    userId: string
    patientId: string   // ← need this to update the correct document
    user: {
        $id: string
        name: string
        email: string
        phone: string
    }
    patient: {
        name: string
        phone: string
        email: string
        profilePic: string
        height: string
        weight: string
        bloodGroup: string
        primaryDoctor: string
        allergies: string
        identificationType: string
        familyMedicalHistory: string
        currentMedication: string
        pastMedicalHistory: string
        disclosureConsent: boolean
        treatmentConsent: boolean
        privacyConsent: boolean
        birthDate: string
        gender: string
        address: string
        occupation: string
        insuranceProvider: string
        insurancePolicyNumber: string
        emergencyContactName: string
        emergencyContactNumber: string
    }
}

type FormValues = z.infer<typeof PatientFormValidation>;

// ── Section Header ─────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
            {title}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
    </div>
)

// ── Read-only Field ────────────────────────────────────────────
const ReadOnlyField = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <div className="flex flex-col gap-1 w-full">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-gray-100 border border-gray-200">
            <Image src={icon} alt={label} height={18} width={18} className="opacity-40" />
            <span className="text-sm text-gray-500 font-mono">{value}</span>
        </div>
    </div>
)

const EditProfileModal = ({ patientId, user, patient }: Props) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const router = useRouter()
    const [Doctors, setDoctors] = useState<Doctor[] | null>(null)

    useEffect(() => {
    async function loadDoctors() {
        const res = await fetch('/api/doctors')
        const data = await res.json()
        setDoctors(data)
    }
    loadDoctors()
    }, [])

    const form = useForm<FormValues>({
        resolver: zodResolver(PatientFormValidation) as Resolver<FormValues>,
        defaultValues: {
            ...PatientFormDefaultValues,
            name: patient?.name ?? user.name ?? "",
            email: patient?.email ?? user.email ?? "",
            phone: patient?.phone ?? user.phone ?? "",
            profilePic: [],
            birthDate: patient?.birthDate ? new Date(patient.birthDate) : new Date(),
            gender: (patient?.gender as any) ?? "male",
            address: patient?.address ?? "",
            occupation: patient?.occupation ?? "",
            emergencyContactName: patient?.emergencyContactName ?? "",
            emergencyContactNumber: patient?.emergencyContactNumber ?? "",
            bloodGroup: patient?.bloodGroup ?? '',
            height: patient?.height ?? '',
            weight: patient?.weight ?? '',
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
        setLoading(true);
        let formData;

        if (values.identificationDocument && values.identificationDocument.length > 0) {
            const file = values.identificationDocument[0]
            formData = new FormData()
            formData.append('blobFile', file)
            formData.append('fileName', file.name)
        }

        try {
            const patientData = {
                userId: user.$id,
                ...values,
                birthDate: new Date(values.birthDate),
                identificationDocument: formData,
            }

            // ✅ updatePatient instead of registerPatient
            const updated = await updatePatient(patientId, patientData as RegisterUserParams)

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
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="group items-center justify-center gap-1 border border-gray-300 hover:border-green-500 hover:text-green-600 transition-all duration-200 h-8 px-4 rounded-full text-[11px] text-gray-600 font-medium text-nowrap mt-1 inline-flex bg-[#e1d7bc]"
            >
                <Image
                    src='/assets/icons/edit-profile.svg'
                    alt='edit profile'
                    height={24}
                    width={24}
                    className='h-4'
                />
                <span>Edit Details</span>
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[90vw] w-fit max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">

                    {/* Modal Header */}
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white/50 z-10 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center">
                                <Image
                                    src='/assets/icons/edit-profile.svg'
                                    alt='edit button'
                                    height={24}
                                    width={24}
                                />
                            </div>
                            <div>
                                <DialogTitle className="text-gray-900 font-semibold text-lg leading-tight">Edit Profile</DialogTitle>
                                <p className="text-xs text-gray-400 mt-0.5">Update your personal and medical details</p>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Form Body */}
                    <div className="px-6 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-gray-700">

                                {/* ── Personal Info ── */}
                                <SectionHeader title="Personal Information" />

                                {/* Read-only fields */}
                                
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
                                        placeholder="John Doe"
                                    />
                                    
                                </div>

                                <div className="flex flex-col xl:flex-row gap-4">
                                    <ReadOnlyField label="Email" value={user.email} icon="/assets/icons/email.svg" />
                                    <ReadOnlyField label="Phone" value={user.phone} icon="/assets/icons/phone.svg" />
                                </div>
                                <br />

                                {/* Editable fields */}
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
                                                            <RadioGroupItem value={option} id={`edit-${option}`} />
                                                            <Label htmlFor={`edit-${option}`} className="cursor-pointer">{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        )}
                                    />
                                </div>

                                <div className="flex flex-col xl:flex-row gap-4">
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

                                <div className="flex flex-col xl:flex-row gap-4">
                                    <CustomFormField
                                        fieldType={FormFieldType.INPUT}
                                        control={form.control}
                                        name="emergencyContactName"
                                        iconSrc='/assets/icons/user.svg'
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

                                <SectionHeader title='Vitals' />

                                <div className="flex gap-10">
                                <CustomFormField
                                fieldType={FormFieldType.SELECT}
                                control={form.control}
                                name="bloodGroup"
                                label="Blood Group"
                                placeholder="your blood group"
                                >
                                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((bloodGroup) => (
                                    <SelectItem key={bloodGroup} value={bloodGroup} className="w-[33%]">
                                    <div className="flex cursor-pointer items-center gap-5 ml-2">
                                        <p className="text-black">{bloodGroup}</p>
                                    </div>
                                    </SelectItem>
                                ))}
                                </CustomFormField>
                
                                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="weight" label="Weight" units="Kg" placeholder="your Weight?" />
                
                                <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name='height' label='Height' units="cm" placeholder="your height?"/>
                                </div>

                                {/* ── Medical Info ── */}
                                <SectionHeader title="Medical Information" />

                                <CustomFormField
                                    fieldType={FormFieldType.SELECT}
                                    control={form.control}
                                    name="primaryDoctor"
                                    label="Primary Physician"
                                    placeholder="Select a Physician"
                                >
                                    {Doctors && Doctors.map((doctor) => (
                                        <SelectItem key={doctor.name} value={doctor.name} className="w-full">
                                            <div className="flex cursor-pointer items-center gap-3 ml-2">
                                                <Image src={doctor.profilePic as any || '/assets/images/user_default.webp'} width={28} height={28} alt={doctor.name} className="rounded-full border border-dark-500" />
                                                <p>{doctor.name}</p>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </CustomFormField>

                                <div className="flex flex-col xl:flex-row gap-4">
                                    <CustomFormField
                                        fieldType={FormFieldType.INPUT}
                                        control={form.control}
                                        name="insuranceProvider"
                                        label="Insurance Provider"
                                        placeholder="e.g. HDFC ERGO, LIC, Acko"
                                    />
                                    <CustomFormField
                                        fieldType={FormFieldType.INPUT}
                                        control={form.control}
                                        name="insurancePolicyNumber"
                                        label="Insurance Policy Number"
                                        placeholder="ABC123456789"
                                    />
                                </div>

                                <div className="flex flex-col xl:flex-row gap-4">
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

                                <div className="flex flex-col xl:flex-row gap-4">
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

                                {/* ── Identification ── */}
                                <SectionHeader title="Identification & Verification" />

                                <CustomFormField
                                    fieldType={FormFieldType.SELECT}
                                    control={form.control}
                                    name="identificationType"
                                    label="Identification Type"
                                    placeholder="Select an identification type..."
                                >
                                    {IdentificationTypes.map((type) => (
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

                                <CustomFormField fieldType={FormFieldType.CHECKBOX} control={form.control} name='treatmentConsent' label='I consent to treatment' />
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
                                    <SubmitButton isLoading={isLoading} className="flex-1 h-10 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm font-medium transition-colors">
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

export default EditProfileModal