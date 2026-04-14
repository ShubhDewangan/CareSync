// components/ui/AvatarUploader.tsx
"use client"

import { convertFileToUrl } from "@/lib/utils"
import Image from "next/image"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

type AvatarUploaderProps = {
  files: File[] | undefined
  onChange: (files: File[]) => void
  defaultSrc?: string
}

const AvatarUploader = ({ files, onChange, defaultSrc }: AvatarUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onChange(acceptedFiles)
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxFiles: 1,
  })

  const previewSrc = files && files.length > 0
    ? convertFileToUrl(files[0])
    : defaultSrc || "/assets/images/user_default.webp"

  return (
    <div className="flex flex-col max-w-[200px] items-center gap-3">

      {/* Circular avatar preview + dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative h-28 w-28 rounded-full cursor-pointer
          border-[3px] border-dashed transition-all duration-200
          ${isDragActive
            ? "border-[#203C67] scale-105"
            : "border-gray-300 hover:border-[#203C67]"
          }
        `}
      >
        <input {...getInputProps()} />

        {/* Avatar image */}
        <Image
          src={previewSrc}
          alt="Profile picture"
          fill
          className="rounded-full object-cover"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Image
              src="/assets/icons/upload.svg"
              height={20}
              width={20}
              alt="upload"
              className="invert"
            />
            <span className="text-white text-[10px] font-semibold">
              {isDragActive ? "Drop!" : "Change"}
            </span>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {files && files.length > 0
            ? <span className="text-[#203C67] font-semibold">{files[0].name}</span>
            : "Click or drag to upload photo"
          }
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WEBP (max 5MB)</p>
      </div>

    </div>
  )
}

export default AvatarUploader