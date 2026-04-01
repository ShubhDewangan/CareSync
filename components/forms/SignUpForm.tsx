/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import CustomFormField from "../CustomFormField"
import SubmitButton from "@/components/SubmitButton"
import { Form } from "@/components/ui/form"
import userImage from '@/public/assets/icons/user.svg'
import emailImage from '@/public/assets/icons/email.svg'
import { UserFormValidation } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { createUser } from "@/lib/actions/patient.actions"
import { showToast } from "../ui/toaster"

export enum FormFieldType {
  INPUT = 'input',
  TEXTAREA = 'textarea',
  PHONE_INPUT = 'phoneInput',
  CHECKBOX = 'checkbox',
  DATEPICKER = 'datePicker',
  SELECT = 'select',
  SKELETON = 'skeleton',
  PASSWORD = 'password'
}

type FormValues = z.infer<typeof UserFormValidation>

export function SignUpForm({onSuccess, setOpenLogin, onClose }: {
  setOpenLogin: any
  onClose: () => void
  onSuccess?: (userData: any) => void
}) {
  const router = useRouter()
  const [isLoading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(UserFormValidation),
    mode: 'all',
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: '',
      confirmPassword: ''
    },
  })

  async function onSubmit({ name, email, phone, password }: FormValues) {
    setLoading(true)

    try {
      const userData = { name, email, phone, password }
      const user = await createUser(userData)

      if (user && typeof user === 'object') {
        // ✅ Account created + verification email sent
        // Close the modal first, then show the toast
        onClose()
        showToast(
          'success',
          '✉️ Account created! Check your email to verify before logging in.',
          'top-right'
        )
        if (user && typeof user === 'object') {
          onSuccess?.(user)   // ← add this line
          onClose()
          showToast('success', '✉️ Account created! Check your email to verify.', 'top-right')
        }

      } else if (user === false) {
        // 409 — user already exists
        showToast('info', 'Account already exists. Please log in.', 'top-right')
        onClose()
        setOpenLogin(true)

      } else {
        showToast('error', 'Something went wrong. Please try again.', 'top-right')
      }

    } catch (error) {
      console.log(error)
      showToast('error', 'Something went wrong. Please try again.', 'top-right')
    }

    setLoading(false)
  }

  return (
    <div className="w-full font-label">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

          <section className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-gray-700 font-heading1 font-thin text-2xl text-nowrap">Create Account</h1>
            <p className="text-sm text-[#6B7280] mt-1">Fill in your details to get started</p>
          </section>

          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name='name'
            label='Full Name'
            iconSrc={userImage}
            iconAlt="User Icon"
            placeholder='John Doe'
          />
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name='email'
            label='Email'
            iconSrc={emailImage}
            iconAlt="Email Icon"
            placeholder='johndoe@example.com'
          />
          <CustomFormField
            fieldType={FormFieldType.PHONE_INPUT}
            control={form.control}
            name='phone'
            label='Phone Number'
            iconAlt="Phone Icon"
            placeholder='+91 2345678910'
          />
          <CustomFormField
            fieldType={FormFieldType.PASSWORD}
            control={form.control}
            name="password"
            label="Password"
            placeholder="Enter your password"
          />
          <CustomFormField
            fieldType={FormFieldType.PASSWORD}
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
          />

          {/* ✅ Info banner — tells user about verification before they submit */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg py-2.5 px-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-xs text-blue-800">
              After signing up, a verification email will be sent. You must verify before logging in.
            </span>
          </div>

          <SubmitButton
            isLoading={isLoading}
            className="w-full h-11 text-white bg-gray-900 rounded-lg mt-1"
          >
            Create Account
          </SubmitButton>

          <p className="text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { onClose(); setOpenLogin(true) }}
              className="text-[#203C67] font-semibold underline underline-offset-2"
            >
              Log in instead
            </button>
          </p>
        </form>
      </Form>
    </div>
  )
}