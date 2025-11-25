import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { config } from '../config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Users, Briefcase, UserX, Loader2, CheckCircle, AlertTriangle, Eye } from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${config.API_BASE_URL}/users/`)
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivateUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      setError('')
      setSuccess('')
      await axios.put(`${config.API_BASE_URL}/users/${userId}/deactivate`)
      setSuccess(`User ${userName} has been deactivated successfully`)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error deactivating user:', error)
      setError(error.response?.data?.error || 'Failed to deactivate user')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.last_name && u.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.company_name && u.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = filterRole === 'all' || u.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && u.is_active) || 
      (filterStatus === 'inactive' && !u.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getUserDisplayName = (user) => {
    if (user.role === 'job_seeker') {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    } else if (user.role === 'employer') {
      return user.company_name || user.email
    }
    return user.email
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'job_seeker':
        return <Users className="h-4 w-4" />
      case 'employer':
        return <Briefcase className="h-4 w-4" />
      case 'admin':
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'job_seeker':
        return 'bg-blue-100 text-blue-800'
      case 'employer':
        return 'bg-green-100 text-green-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStats = () => {
    const total = users.length
    const active = users.filter(u => u.is_active).length
    const inactive = users.filter(u => !u.is_active).length
    const jobSeekers = users.filter(u => u.role === 'job_seeker').length
    const employers = users.filter(u => u.role === 'employer').length
    const admins = users.filter(u => u.role === 'admin').length

    return { total, active, inactive, jobSeekers, employers, admins }
  }

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users and monitor platform activity</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.jobSeekers}</div>
              <div className="text-sm text-gray-600">Job Seekers</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.employers}</div>
              <div className="text-sm text-gray-600">Employers</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View all users and manage their accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="job_seeker">Job Seekers</option>
                  <option value="employer">Employers</option>
                  <option value="admin">Admins</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {getRoleIcon(u.role)}
                            <span className="ml-2 font-medium">
                              {getUserDisplayName(u)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{u.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(u.role)}>
                            {u.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.is_active && u.role !== 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeactivateUser(u.id, getUserDisplayName(u))}
                              className="ml-2"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          )}
                          {!u.is_active && (
                            <span className="text-sm text-gray-500">Deactivated</span>
                          )}
                          {u.role === 'admin' && (
                            <span className="text-sm text-gray-500">Protected</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard