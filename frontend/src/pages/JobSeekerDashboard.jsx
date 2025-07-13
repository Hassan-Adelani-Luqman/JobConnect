import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, MapPin, Clock, Building, Loader2 } from 'lucide-react'

const JobSeekerDashboard = () => {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    location: '',
    job_type: 'all'
  })

  useEffect(() => {
    fetchJobs()
    fetchApplications()
  }, [])

  const fetchJobs = async (filters = {}) => {
    try {
      setSearchLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await axios.get(`/jobs?${params.toString()}`)
      setJobs(response.data.jobs)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to fetch jobs')
    } finally {
      setSearchLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/jobs/my-applications')
      setApplications(response.data.applications)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs(searchFilters)
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...searchFilters, [key]: value === 'all' ? '' : value }
    setSearchFilters(newFilters)
    fetchJobs(newFilters)
  }

  const applyForJob = async (jobId) => {
    try {
      await axios.post(`/jobs/${jobId}/apply`)
      fetchApplications() // Refresh applications
      fetchJobs(searchFilters) // Refresh jobs to update application status
    } catch (error) {
      console.error('Error applying for job:', error)
      setError(error.response?.data?.error || 'Failed to apply for job')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800'
      case 'Accepted': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const hasApplied = (jobId) => {
    return applications.some(app => app.job_id === jobId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Seeker Dashboard</h1>
        <p className="text-gray-600 mt-2">Find and apply for your dream job</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Job Search Section */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Search Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Search by title, company, or skills..."
                    value={searchFilters.search}
                    onChange={(e) => setSearchFilters({ ...searchFilters, search: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Location"
                    value={searchFilters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                  <Select value={searchFilters.job_type} onValueChange={(value) => handleFilterChange('job_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Job Listings */}
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No jobs found. Try adjusting your search criteria.</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          <Link to={`/job/${job.id}`} className="hover:text-blue-600">
                            {job.title}
                          </Link>
                        </h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building className="h-4 w-4 mr-1" />
                          <span>{job.employer_name}</span>
                        </div>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600 mb-4">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{job.job_type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {hasApplied(job.id) ? (
                          <Badge className="bg-green-100 text-green-800">Applied</Badge>
                        ) : (
                          <Button onClick={() => applyForJob(job.id)}>
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {job.description}
                    </p>
                    
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Applications Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your job applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No applications yet</p>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium text-sm">
                        <Link to={`/job/${application.job_id}`} className="hover:text-blue-600">
                          {application.job_title}
                        </Link>
                      </h4>
                      <Badge className={`text-xs mt-1 ${getStatusColor(application.status)}`}>
                        {application.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied {new Date(application.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {applications.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {applications.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default JobSeekerDashboard

