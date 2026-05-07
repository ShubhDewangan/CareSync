/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { DataTable } from "./DataTable"
import { getColumns } from "./columns"

type Doctor = { $id: string; name: string; profilePic?: string }

export default function AdminTable({ doctors, data }: { doctors: Doctor[]; data: any[] }) {
  const columns = getColumns(doctors)
  return <DataTable columns={columns} data={data} />
}