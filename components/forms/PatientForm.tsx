"use client"

import * as React from "react"
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import CustomFormField from "../CustomFormField"
// import { Button } from "@/components/ui/button"
import SubmitButton from "@/components/SubmitButton"
// import { Label } from "@/components/ui/label"
import { Form } from "@/components/ui/form"

import userImage from '@/public/assets/icons/user.svg'
import emailImage from '@/public/assets/icons/email.svg'
import { UserFormValidation } from "@/lib/validation"
import { redirect, useRouter } from "next/navigation"
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
  
// let userDataToRegisterDirectory = {}
const signinKey = localStorage.getItem('signinKey')

export function PatientForm() {
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


    if (signinKey) {
    redirect(`/patients/${signinKey}/dashboard`)
  }
  

  async function onSubmit({name, email, phone, password}: z.infer<typeof UserFormValidation>) {
    
    setLoading(true)

    try {
      const userData = {name, email, phone, password}
      // userDataToRegisterDirectory = userData

      // console.log(userDataToRegisterDirectory);
      

      const user = await createUser(userData)
      console.log(user || 'kuch nhi aya');
      
      if (user) {
          router.push(`/patients/${user.$id}/register`)
      } else if (user === false) {
          // user already exists (409)
          showToast('info', 'User already exists! Please log in...', 'top-right')
      } else {
          // something else went wrong (null)
          showToast('error', 'Something went wrong. Please try again.', 'top-right')
      }
    } catch (error) {
      console.log(error);
      
    }

    setLoading(false)
    
  }
  
  return (
    <div className="w-full font-label">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 flex flex-col justify-center items-center text-gray-950 w-full m-5">
            <section className="flex flex-col items-center justify-center mb-6 text-(--secondary) w-full">
                <h1 className="header text-gray-700 font-heading1 font-thin text-nowrap">Create Account</h1>
            </section>
          
          <CustomFormField 
          fieldType={FormFieldType.INPUT} 
          control={form.control} 
          name='name'
          label='Full name'
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
          // iconSrc={phoneImage}
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

          <div className="flex gap-3 mt-1 w-full items-center justify-center ">
            {/* <Button type="button" className="w-2/5" variant="outline" onClick={() => form.reset()}>
              Reset
            </Button> */}
            <SubmitButton isLoading={isLoading} className="w-full h-10 text-white bg-gray-900">Register</SubmitButton>
          </div>

        </form>
      </Form>
    </div>
  )
}

// export default userDataToRegisterDirectory
