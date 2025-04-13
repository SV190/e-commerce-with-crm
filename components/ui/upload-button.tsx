import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface UploadButtonProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  accept?: string
  multiple?: boolean
  className?: string
  children?: React.ReactNode
}

export function UploadButton({
  onChange,
  accept = "image/*",
  multiple = true,
  className,
  children
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className={className}
      >
        {children || (
          <>
            <Upload className="mr-2 h-4 w-4" />
            <span>Загрузить файл</span>
          </>
        )}
      </Button>
    </>
  )
} 