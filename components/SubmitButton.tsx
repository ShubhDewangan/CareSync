import {Button} from '@/components/ui/button'
// import Image from 'next/image'
// import loader from '@/public/assets/icons/loader.svg'
import { Spinner } from './ui/spinner'

interface ButtonProps {
    isLoading: boolean,
    className?: string,
    children: React.ReactNode,
    text?: string
}

const SubmitButton = ({ isLoading, className, children, text }: ButtonProps) => {
  return (
    <Button type="submit" disabled={isLoading} className={className ?? `shad-secondary-bn bg-green-500`}>
        {isLoading ? (
            <div className='flex items-center gap-4'>
                {/* <Image
                    src={loader}
                    alt='Loader'
                    width={24}
                    height={24}
                    className='animate-spin h-5'
                /> */}
                <Spinner />
                {text ? text : 'Creating account...'}
            </div>
        ): children}
    </Button>
  )
}

export default SubmitButton
