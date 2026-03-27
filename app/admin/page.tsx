/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import Image from 'next/image'
import StatCard from '@/components/ui/StatCard'
import { recentAppointments } from '@/lib/actions/appointment.actions'
import { DataTable } from '@/components/table/DataTable'
import { columns } from '@/components/table/columns'

const Admin = async () => {
    const appointments = await recentAppointments()

    let scheduledCount;
    let pendingCount;
    let cancelledCount;
    
    if (!appointments) {
        scheduledCount = 0
        pendingCount = 0
        cancelledCount = 0
    } else {
        scheduledCount = appointments.scheduledCount
        pendingCount = appointments.pendingCount
        cancelledCount = appointments.cancelledCount
    }
    

  return (
    <div className='mx-auto flex max-w-7xl flex-col space-y-10'>
      <header className='admin-header'>
        <Link href='/' className='cursor-pointer'>
            <Image
                src='/logo.png'
                alt='Logo'
                height={64}
                width={300}
                className='h-10 w-fit'
            />
        </Link>

        <p className='text-16-semibold'>Admin Dashboard</p>
      </header>

      <main className='admin-main'>
        <section className='w-full space-y-4'>
            <h1 className='header'>Welcome Admin!</h1>
            <p className='text-dark-700'>You can Manage new Appointments here...</p>
        </section>

        <section className='admin-stat'>
            <StatCard
                type='scheduled'
                count={scheduledCount}
                label='Scheduled Appointments'
                icon='/assets/icons/appointments.svg'
            />
            <StatCard
                type='pending'
                count={pendingCount}
                label='Pending Appointments'
                icon='/assets/icons/pending.svg'
            />
            <StatCard
                type='cancelled'
                count={cancelledCount}
                label='Cancelled Appointments'
                icon='/assets/icons/cancelled.svg'
            />
        </section>

        <DataTable columns={columns} data={appointments?.documents as any} />
      </main>
    </div>
  )
}

export default Admin
