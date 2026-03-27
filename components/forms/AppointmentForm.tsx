/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CustomFormField from "../CustomFormField";
// import { Button } from "@/components/ui/button"
import SubmitButton from "@/components/SubmitButton";
// import { Label } from "@/components/ui/label"
import { Form } from "@/components/ui/form";

import Image from "next/image";

import userImage from "@/public/assets/icons/user.svg";
import calenderImage from "@/public/assets/icons/calendar.svg";
import { getAppointmentSchema} from "@/lib/validation";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/actions/patient.actions";
import { Doctors } from "@/constants";
import { SelectItem } from "../ui/select";
import { Appointment } from "@/types/appwrite";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";

export enum FormFieldType {
  INPUT = "input",
  TEXTAREA = "textarea",
  PHONE_INPUT = "phoneInput",
  CHECKBOX = "checkbox",
  DATEPICKER = "datePicker",
  SELECT = "select",
  SKELETON = "skeleton",
}


// let userDataToRegisterDirectory = {}

const AppointmentForm = ({
  userId,
  patientId,
  type,
  appointment,
  setOpen
}: {
  userId: string;
  patientId: string;
  type: "create" | "cancel" | 'schedule';
  appointment?: Appointment;
  setOpen?: (open: boolean) => void
}) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  const AppointmentFormValidation = getAppointmentSchema(type)

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(AppointmentFormValidation),
  defaultValues: {
    primaryDoctor: appointment && appointment.primaryDoctor,
    schedule: appointment ? new Date(appointment.schedule) : new Date(),
    reason: appointment ? appointment.reason : '',
    note: appointment ? appointment.note : '',
    cancellationReason: '',
  },
});

  async function onSubmit(values: z.infer<typeof AppointmentFormValidation>) {
    setLoading(true);
    console.log('I m here');
    

    let status = '';
    switch (type) {
        case 'schedule':
            status = 'scheduled';
            break;
        case 'cancel':
            status = 'cancelled';
            break;
        default:
            status = 'pending'
            break;
    }

    try {
    if (type === 'create' && patientId) {
        const appointmentData = {
            userId,
            patient: patientId,
            primaryDoctor: values.primaryDoctor,
            schedule: new Date(values.schedule),
            reason: values.reason!,
            note: values.note,
            status: status as Status,
        }
        
        const newAppointment = await createAppointment(appointmentData)

        if (newAppointment) {
            form.reset();
            router.push(`/patients/${userId}/new-appointment/success?appointmentId=${newAppointment.$id}`)
        }
    } else {
        const appointmentToUpdate = {
            userId: userId as string,
            appointmentId: appointment?.$id as string,
            appointment: {
                primaryDoctor: values?.primaryDoctor as string,
                schedule: new Date(values?.schedule) as Date,
                status: status as Status,
                cancellationReason: values?.cancellationReason as string | undefined
            },
            type
        }
        console.log('appointmentToUpdate:', appointmentToUpdate)
        const updatedAppointment = await updateAppointment(appointmentToUpdate)
        

        if (updatedAppointment) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            setOpen && setOpen(false)
            form.reset()
        }
    }
} catch (error) {
    console.log(error);
}

    setLoading(false);
  }

  let buttonLabel;

  switch (type) {
    case 'cancel':
        buttonLabel = 'Cancel Appointment'
        break;

    case 'create':
        buttonLabel = 'Create Appointment'
        break

    case 'schedule':
        buttonLabel = 'Schedule Appointment'
    default:
        break;
  }



  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {type === 'create' && <section className="mb-8 text-(--secondary)">
            <h1 className="header">New Appointment</h1>
            <p className="text-dark-700">Schedule your first appointment</p>
          </section>}

          {type !== "cancel" && (
            <>
              <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="primaryDoctor"
                label="Doctor"
                iconSrc={userImage}
                placeholder="Select Doctor as per your requirement"
                iconAlt="User Icon"
              >
                {Doctors.map((doctor) => (
                  <SelectItem
                    key={doctor.name}
                    value={doctor.name}
                    className="w-full"
                  >
                    <div className="flex cursor-pointer items-center gap-5 ml-2">
                      <Image
                        src={doctor.image}
                        width={32}
                        height={32}
                        alt={doctor.name}
                        className="rounded-full border border-dark-500"
                      />
                      <p>{doctor.name}</p>
                    </div>
                  </SelectItem>
                ))}
              </CustomFormField>

              <div className="flex flex-col gap-10 xl:flex-row w-full object-cover">
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="reason"
                  label="Reason for Appointment"
                  placeholder="e.g. Monthly check-up"
                />
                {type === 'create' ?
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="note"
                  label="Additional Comments/Notes"
                  // iconSrc={phoneImage}
                  placeholder="Type your comments or notes (completely optional)"
                />: 
                  <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="note"
                  label="Message"
                  // iconSrc={phoneImage}
                  placeholder="write a message"
                />
                }
              </div>

              <CustomFormField
                iconSrc={calenderImage}
                iconAlt="calender"
                fieldType={FormFieldType.DATEPICKER}
                control={form.control}
                showTimeSelect={true}
                dateFormat="dd/MM/yyyy - h:mm aa"
                name="schedule"
                label="Schedule your Appointment"
                placeholder="Choose your appointment date!"
              />
            </>
          )}

          {
            type === 'cancel' && (
                <CustomFormField
                    fieldType={FormFieldType.TEXTAREA}
                    control={form.control}
                    name='cancellationReason'
                    label='Reason for Cancellation'
                    placeholder='Enter Reason for cancellation'
                    Required='true'
                    />
            )
          }

          <div className="flex gap-3 pt-2 w-full items-center justify-center  ">
            {/* <Button type="button" className="w-2/5" variant="outline" onClick={() => form.reset()}>
              Reset
            </Button> */}
            <SubmitButton
              isLoading={isLoading}
              className={`${type === 'cancel' ? 'shad-danger-btn' : 'shad-primary-btn'} w-full`}
              text='Scheduling...'
            >
              {buttonLabel}
            </SubmitButton>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AppointmentForm;

// export default userDataToRegisterDirectory
