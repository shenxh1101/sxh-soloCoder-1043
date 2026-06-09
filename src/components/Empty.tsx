import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface EmptyProps {
  description?: string;
  className?: string;
}

export default function Empty({ description = '暂无数据', className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-gray-400', className)}>
      <Inbox className="h-12 w-12 mb-3" />
      <p className="text-sm">{description}</p>
    </div>
  )
}
