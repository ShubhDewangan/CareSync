'use client'

import React, { useState } from 'react'
import CustomFormField from '../CustomFormField'
import { FormFieldType } from './PatientForm'
import { LoginFormValidation } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { Form } from '../ui/form'
import { showToast } from '../ui/toaster'
import { loginUser } from '@/lib/actions/auth.actions'
import { Button } from '../ui/button'
import { redirect } from 'next/navigation'

type FormValues = z.infer<typeof LoginFormValidation>

const LoginForm = () => {
    const [isLoading, setLoading] = useState(false)
      const signinKey = localStorage.getItem('signinKey')

    if (signinKey) {
    redirect(`/patients/${signinKey}/dashboard`)
  }

    const form = useForm<FormValues>({
        resolver: zodResolver(LoginFormValidation),
        mode: 'all',
        defaultValues: {
          email: "",
          password: '',
        },
      });

      async function onSubmit({ email, password}: z.infer<typeof LoginFormValidation>) {
          setLoading(true)
      
          try {
            // userDataToRegisterDirectory = userData
      
            // console.log(userDataToRegisterDirectory);
            
      
            const result = await loginUser({ email, password })

            console.log(result);
            

            if (result?.success && result.userId) {
                window.location.assign(`/patients/${result.userId}/dashboard`)
            } else {
                showToast('error', result?.message ?? 'Login failed', 'top-right')
            }


          } catch (error) {
            console.log(error);
            
          } finally {
            setLoading(false)
          }
      
          
        }
  return (
      <div className="w-full font-label">
        <Form {...form}>
          <div className="space-y-4 flex flex-col justify-center items-center text-gray-950 w-full m-5">
              <section className="flex flex-col items-center justify-center mb-8 text-(--secondary) w-full">
                  <h1 className="header text-gray-700 font-heading1 font-thin">Login</h1>
              </section>
            
            {/* <CustomFormField 
            fieldType={FormFieldType.INPUT} 
            control={form.control} 
            name='name'
            label='Full name'
            iconSrc='/assets/icons/user.svg'
            iconAlt="User Icon"
            placeholder='John Doe'
            /> */}
            <CustomFormField 
            fieldType={FormFieldType.INPUT} 
            control={form.control} 
            name='email'
            label='Email'
            iconSrc='/assets/icons/email.svg'
            iconAlt="Email Icon"
            placeholder='johndoe@example.com'
            />
            {/* <CustomFormField 
            fieldType={FormFieldType.PHONE_INPUT} 
            control={form.control} 
            name='phone'
            label='Phone Number'
            // iconSrc={phoneImage}
            iconAlt="Phone Icon"
            placeholder='+91 2345678910' */}
            {/* /> */}
            <CustomFormField
              fieldType={FormFieldType.PASSWORD}
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
            />
  
            <div className="flex gap-3 pt-2 w-full items-center justify-center ">
              <Button
                type="button"
                disabled={isLoading}
                className="w-full h-10 text-white bg-gray-900"
                onClick={() => void form.handleSubmit(onSubmit)()}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
  
          </div>
        </Form>
      </div>
    )
}

export default LoginForm
