'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/lib/utils'
import { LoadingSpinner, Card, ErrorMessageCard } from '@/components/ui'
import { useSmartDataFetching } from '@/hooks'
import { deleteUser, listUsers, updateUser } from '@/actions/users'
import { getErrorMessage } from '@/actions/http'
import PasswordResetModal from '@/components/PasswordResetModal'
import { 
  UserIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { USER_ROLES, USER_STATUSES, type User, type UserRole, type UserStatus, type UsersApiResponse } from '@/types/user'

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    email: string
    role: UserRole
    status: UserStatus
  }>({
    email: '',
    role: 'USER',
    status: 'ACTIVE'
  })

  // Use smart data fetching with caching
  const { 
    data: usersData, 
    loading, 
    error,
    refetch
  } = useSmartDataFetching<User[]>({
    cacheKey: 'users:list',
    fetcher: ({ signal }) => listUsers(signal),
    autoFetch: currentUser?.role === 'ADMIN',
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500, // Debounce API calls
    transform: (data: unknown) => (data as UsersApiResponse).users || []
  })

  const users = usersData || []

  const startEditing = (user: User) => {
    setEditingUserId(user.id)
    setEditForm({
      email: user.email,
      role: user.role,
      status: user.status
    })
  }

  const cancelEditing = () => {
    setEditingUserId(null)
    setEditForm({ email: '', role: 'USER', status: 'ACTIVE' })
  }

  const handleUpdateUser = async (userId: string) => {
    try {
      setSavingUserId(userId)
      await updateUser(userId, editForm)
      addNotification({
        type: 'success',
        title: 'User Updated',
        message: 'User details were updated successfully',
        duration: 5000
      })
      cancelEditing()
      await refetch()
    } catch (updateError) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: getErrorMessage(updateError, 'Failed to update user'),
        duration: 5000
      })
    } finally {
      setSavingUserId(null)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      addNotification({
        type: 'error',
        title: 'Delete Blocked',
        message: 'You cannot delete your own account',
        duration: 5000
      })
      return
    }

    const confirmed = window.confirm(`Delete ${user.email}? This cannot be undone.`)
    if (!confirmed) return

    try {
      setDeletingUserId(user.id)
      await deleteUser(user.id)
      addNotification({
        type: 'success',
        title: 'User Deleted',
        message: `${user.email} was deleted successfully`,
        duration: 5000
      })
      await refetch()
    } catch (deleteError) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: getErrorMessage(deleteError, 'Failed to delete user'),
        duration: 5000
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  const UsersContent = () => {
    if (loading) {
      return <LoadingSpinner />
    }

    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 xs:mt-2 md:mt-3 text-xs xs:text-sm md:text-base text-gray-700">
              Manage system users and roles.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-500 sm:text-base">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{users.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hidden sm:block">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-medium text-gray-500">Admin Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </Card>

          <Card className="hidden sm:block">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-medium text-gray-500">Regular Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role !== 'ADMIN').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && <ErrorMessageCard message={error} />}

        {/* Users List */}
        <Card className="overflow-hidden">
          <div className="px-4 xs:px-5 md:px-6 py-4 xs:py-5 md:py-6">
            <h3 className="text-base xs:text-lg md:text-xl font-medium text-gray-900 mb-4">System Users</h3>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-right text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3 xs:ml-4">
                              {editingUserId === user.id ? (
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                                  className="w-56 rounded-md border border-gray-300 px-2 py-1 text-xs xs:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="text-xs xs:text-sm font-medium text-gray-900">{user.email}</div>
                              )}
                              <div className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap">
                          {editingUserId === user.id ? (
                            <select
                              value={editForm.role}
                              onChange={(event) => setEditForm({ ...editForm, role: event.target.value as UserRole })}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {USER_ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                              user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap">
                          {editingUserId === user.id ? (
                            <select
                              value={editForm.status}
                              onChange={(event) => setEditForm({ ...editForm, status: event.target.value as UserStatus })}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {USER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap text-xs xs:text-sm text-gray-500">
                          {formatRelativeTime(new Date(user.createdAt))}
                        </td>
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap text-right">
                          {editingUserId === user.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateUser(user.id)}
                                disabled={savingUserId === user.id}
                                className="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                <CheckIcon className="mr-1 h-4 w-4" />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <XMarkIcon className="mr-1 h-4 w-4" />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(user)}
                                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                title="Edit user"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              {user.role !== 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => setResetUser(user)}
                                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                  title="Reset password"
                                >
                                  <KeyIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUserId === user.id || user.id === currentUser?.id}
                                className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Delete user"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <AdminRouteGuard>
      <UsersContent />
      <PasswordResetModal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        user={resetUser}
      />
    </AdminRouteGuard>
  )
}
