import { useNotifications } from '@/contexts/NotificationContext'

interface DeleteConfirmationOptions {
  title?: string
  message?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export const useDeleteConfirmation = () => {
  const { addNotification } = useNotifications()

  const confirmDelete = (
    id: string, 
    name: string, 
    deleteFunction: (id: string) => Promise<void>,
    options: DeleteConfirmationOptions = {}
  ) => {
    const {
      title = 'Confirm Delete',
      message = `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      onSuccess,
      onError
    } = options

    addNotification({
      type: 'warning',
      title,
      message,
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          onClick: async () => {
            try {
              await deleteFunction(id)
              onSuccess?.()
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Delete failed'
              onError?.(errorMessage)
            }
          },
          variant: 'danger'
        }
      ]
    })
  }

  return { confirmDelete }
}

export default useDeleteConfirmation
