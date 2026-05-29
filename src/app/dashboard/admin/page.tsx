'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/lib/utils'
import { createUser, listUsers } from '@/actions/users'
import { getErrorMessage } from '@/actions/http'
import { 
  UsersIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { USER_ROLES, USER_STATUSES, type User, type UserRole, type UserStatus } from '@/types/user'

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<{
    email: string
    password: string
    role: UserRole
    status: UserStatus
  }>({
    email: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE'
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listUsers()
      setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: getErrorMessage(error, 'Failed to connect to server'),
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [currentUser, fetchUsers])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const created = await createUser(createForm)
      addNotification({
        type: 'success',
        title: 'User Created',
        message: `User ${created.email} created successfully`,
        duration: 5000
      })
      setCreateForm({ email: '', password: '', role: 'USER', status: 'ACTIVE' })
      setShowCreateForm(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: getErrorMessage(error, 'Failed to create user'),
        duration: 5000
      })
    }
  }

  const generateUserCredentials = () => {
    const roles: UserRole[] = ['USER', 'MANAGER']
    const statuses: UserStatus[] = ['ACTIVE', 'INACTIVE']
    
    // Generate random email
    const domains = ['shop.com', 'store.com', 'business.com', 'company.com']
    const names = ['john', 'jane', 'mike', 'sarah', 'david', 'lisa', 'tom', 'anna', 'james', 'emma']
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomDomain = domains[Math.floor(Math.random() * domains.length)]
    const randomNumber = Math.floor(Math.random() * 1000)
    const email = `${randomName}${randomNumber}@${randomDomain}`
    
    // Generate random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Random role and status
    const role = roles[Math.floor(Math.random() * roles.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    setCreateForm({
      email,
      password,
      role,
      status
    })
  }

  const getSystemStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length
    const adminUsers = users.filter(u => u.role === 'ADMIN').length
    const suspendedUsers = users.filter(u => u.status === 'SUSPENDED').length

    return { totalUsers, activeUsers, adminUsers, suspendedUsers }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'USER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const AdminDashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    const stats = getSystemStats()

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              System administration and user management overview
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <UsersIcon className="h-6 w-6 text-gray-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-red-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Admin Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.adminUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Suspended</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.suspendedUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
              <button
                onClick={generateUserCredentials}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                🎲 Generate User
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Password will be visible when generated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'Manager' : 'User'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {USER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Users</h3>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UsersIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminRouteGuard>
      <AdminDashboardContent />
    </AdminRouteGuard>
  )
}
