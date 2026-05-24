/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { FormFieldType } from "../app/(root)/signin/SignUpForm";
import Image from "next/image";

import "react-phone-number-input/style.css";
// import PhoneInput from 'react-phone-number-input'
import PhoneInput from "react-phone-number-input/input";
import flags from "react-phone-number-input/flags";
// import { ZodE164 } from 'zod'
import { E164Number } from "libphonenumber-js/core";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";

interface CustomProps {
  control: Control<any>;
  fieldType: FormFieldType;
  name: string;
  label?: string;
  placeholder?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
  dateFormat?: string;
  showTimeSelect?: boolean;
  children?: React.ReactNode;
  renderSkeleton?: (field: unknown) => React.ReactNode;
  Required?: string
  value?: any
  units?: string
  time?: boolean
}

const RenderField = ({ field, props }: { field: any; props: CustomProps }) => {
  const {
    fieldType,
    iconSrc,
    iconAlt,
    placeholder,
    showTimeSelect,
    renderSkeleton,
    Required,
    disabled,
    units,
    time=true,
  } = props;

  const [showPassword, setShowPassword] = useState(false)

  switch (props.fieldType) {
    case FormFieldType.INPUT:
      return (
        <div className="flex rounded-md border border-dark-500 bg-[#EFECE3] items-center">
          {iconSrc && (
            <Image
              src={iconSrc}
              height={24}
              width={24}
              alt={iconAlt || "icon"}
              className="ml-2"
            />
          )}
          {/* {
            value ? <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              className="shad-input border-0 "
              disabled={disabled}
              value={value}
            /> */
          /* </FormControl> :*/ }
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              className="shad-input text-gray-600 border-0 font-ubuntuMono"
              disabled={disabled}
            />
          </FormControl>
          {units && (
            <p className="px-3 font-ubuntuMono font-medium">{units}</p>
          )}
        </div>
      );

    case FormFieldType.PHONE_INPUT:
      return (<div className="flex w-full rounded-md border border-dark-500 bg-[#EFECE3]">
            <Image
              src='/assets/icons/phone.svg'
              alt="phone"
              height={24}
              width={24}
              className="ml-2"
            />
        <FormControl className="w-full">
          <PhoneInput
            country="IN"
            flags={flags}
            placeholder={placeholder}
            value={field.value as E164Number | undefined}
            onChange={field.onChange}
            // inputProps={{...field}}
            //
            className={`input-phone flex-1 text-gray-400`}
            disabled={disabled}
          />
        </FormControl></div>
      );

    case FormFieldType.DATEPICKER:
      return (
        <div className="flex w-full rounded-md border border-dark-500 bg-[#EFECE3]">
          {iconSrc && (
            <Image
              src={iconSrc}
              alt="calender"
              height={24}
              width={24}
              className="ml-2"
            />
          )}
          <FormControl>
            <DatePicker
              selected={field.value}
              onChange={(date: any) => {
                if (date && !time) {
                  date.setHours(0, 0, 0, 0); // strip time portion
                }
                field.onChange(date);
              }}
              showTimeSelect={time === true}
              showTimeSelectOnly={false}
              dateFormat={time ? "d-MMMM-yyyy | h:mm aa" : "d-MMMM-yyyy"}
              wrapperClassName="date-picker flex-1"
            />
          </FormControl>
        </div>
      );

    case FormFieldType.SKELETON:
      return renderSkeleton ? renderSkeleton(field) : null;

    case FormFieldType.SELECT:
      return (
        <div className="flex rounded-md border bg-[#EFECE3]">
        {iconSrc && (
            <Image
              src={iconSrc}
              alt="calender"
              height={24}
              width={24}
              className="ml-2"
            />
          )}
        <FormControl>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="shad-select-trigger w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>

            <SelectContent className="shad-select-content">
              {props.children}
            </SelectContent>
          </Select>
        </FormControl>
        </div>
      );

    case FormFieldType.TEXTAREA:
      return (
        <FormControl>
          <Textarea
            required={Required}
            placeholder={placeholder}
            {...field}
            className="shad-textArea"
            disabled={props.disabled}
          />
        </FormControl>
      )

    case FormFieldType.CHECKBOX:
      return (
        <FormControl>
          <div className='flex items-center gap-4'>
          <Checkbox
            id={props.name}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <label htmlFor={props.name} className="checkbox-label">
            {props.label}
          </label>
        </div>
        </FormControl>
      )

    case FormFieldType.PASSWORD:
      return (
        <div className="flex rounded-md border border-dark-500 bg-[#EFECE3]">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={props.placeholder}
            {...field}
            className="shad-input border-0"
          />
          <button
            type="button"
            className="mr-3 text-dark-600"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <Image
              src={showPassword ? '/assets/icons/eye-svg.svg' : '/assets/icons/eye-slash.svg'}
              alt="toggle password"
              width={20}
              height={20}
            />
          </button>
        </div>
      )

    default:
      break;
  }
};

const CustomFormField = (props: CustomProps) => {
  const { control, fieldType, name, label } = props;
  return (
    <>
      <div className="w-full">
        <FormField
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem className="w-full bg-transparent">
              {fieldType !== FormFieldType.CHECKBOX && label && (
                <FormLabel className="text-md text-black">{label}</FormLabel>
              )}

              <RenderField field={field} props={props} />

              <div className="h-2">
                <FormMessage className="shad-error" />
              </div>
            </FormItem>
          )}
        />
      </div>
      
    </>
  );
};

export default CustomFormField;
