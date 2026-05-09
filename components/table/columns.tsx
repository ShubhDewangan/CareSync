"use client";

import { ColumnDef } from "@tanstack/react-table";
import StatusBadge from "../StatusBadge";
import { formatDateTime } from "@/lib/utils";
import Image from 'next/image'
import AppointmentModal from "../AppointmentModal";
import { Appointment } from "@/types/appwrite";

// Doctor type matching your Appwrite document shape
type Doctor = {
  $id: string;
  name: string;
  profilePic?: string;
};

export const getColumns = (doctors: Doctor[]): ColumnDef<Appointment>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <p className="text-14-medium">{row.index + 1}</p>
  },
  {
    accessorKey: 'patient',
    header: 'Patient',
    cell: ({ row }) => <p className="text-14-medium">{row.original.patient?.name ?? 'N/A'}</p>
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <p className="text-14-medium">{row.original.patient?.email ?? 'N/A'}</p>
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => <p className="text-14-medium">{row.original.patient?.phone ?? 'N/A'}</p>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className="min-w-[115px]">
        <StatusBadge status={row.original.status || "pending"} />
      </div>
    )
  },
  {
    accessorKey: "schedule",
    header: "Appointment",
    cell: ({ row }) => (
      <p className="text-14-regular min-w-[100px]">
        {formatDateTime(row.original.schedule).dateTime}
      </p>
    )
  },
  {
    accessorKey: "primaryDoctor",
    header: () => 'Doctor',
    cell: ({ row }) => {
      const doctor = doctors.find((doc) => doc.name === row.original.primaryDoctor);

      return doctor ? (
        <div className="flex items-center gap-3">
          {doctor.profilePic && (
            <Image
              src={doctor.profilePic || '/assets/images/user_default.webp'}
              alt={doctor.name}
              width={100}
              height={100}
              className="size-8"
            />
          )}
          <p className="whitespace-nowrap">Dr. {doctor.name}</p>
        </div>
      ) : <span>N/A</span>;
    }
  },
  {
    id: "actions",
    header: () => <div className="pl-4">Actions</div>,
    cell: ({ row: { original: data } }) => (
      <div className="flex gap-1">
        <AppointmentModal
          type='schedule'
          patientId={data.patient?.$id}
          userId={data.userId}
          appointment={data}
        />
        <AppointmentModal
          type='cancel'
          patientId={data.patient?.$id}
          userId={data.userId}
          appointment={data}
        />
      </div>
    )
  }
];