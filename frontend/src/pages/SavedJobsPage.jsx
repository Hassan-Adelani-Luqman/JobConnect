import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { config } from '../config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  HeartOff, 
  MapPin, 
  Clock, 
  Building2, 
  Calendar,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const SavedJobsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unsavingJob, setUnsavingJob] = useState(null)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 10
  })

  useEffect(() => {
    if (user?.role === 'job_seeker') {
      fetchSavedJobs(1)
    }
  }, [user])

  const fetchSavedJobs = async (page = 1) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await axios.get(`${config.API_BASE_URL}/jobs/saved`, {
        params: { page, per_page: 10 }
      })
      
      setSavedJobs(response.data.saved_jobs)
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        total: response.data.total,
        perPage: response.data.per_page
      })
      
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
      setError('Failed to load saved jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsaveJob = async (jobId) => {
    try {
      setUnsavingJob(jobId)
      await axios.delete(`${config.API_BASE_URL}/jobs/${jobId}/unsave`)
      
      // Remove the job from the local state
      setSavedJobs(prevJobs => prevJobs.filter(savedJob => savedJob.job.id !== jobId))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      
    } catch (error) {
      console.error('Error unsaving job:', error)
      setError('Failed to remove job from saved list')
    } finally {
      setUnsavingJob(null)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSavedJobs(newPage)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getJobTypeColor = (jobType) => {
    const colors = {
      'Full-time': 'bg-green-100 text-green-800',
      'Part-time': 'bg-blue-100 text-blue-800',
      'Contract': 'bg-purple-100 text-purple-800',
      'Remote': 'bg-orange-100 text-orange-800'
    }
    return colors[jobType] || 'bg-gray-100 text-gray-800'
  }

  // Redirect if not job seeker
  if (user && user.role !== 'job_seeker') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only job seekers can view saved jobs.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
        <p className="text-gray-600 mt-2">Jobs you've bookmarked for later</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : savedJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs yet</h3>
            <p className="text-gray-600 mb-6">Start browsing jobs and save the ones you're interested in.</p>
            <Button onClick={() => navigate('/dashboard')}>Browse Jobs</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {savedJobs.length} of {pagination.total} saved jobs
            </p>
          </div>

          {/* Jobs list */}
          <div className="space-y-6">
            {savedJobs.map((savedJob) => {
              const job = savedJob.job
              return (
                <Card key={savedJob.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {job.title}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <Building2 className="h-4 w-4 mr-1" />
                              <span>{job.employer_name}</span>
                              <span className="mx-2">•</span>
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getJobTypeColor(job.job_type)}>
                              {job.job_type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnsaveJob(job.id)}
                              disabled={unsavingJob === job.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {unsavingJob === job.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <HeartOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Posted {formatDate(job.created_at)}</span>
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              <span>Saved {formatDate(savedJob.saved_at)}</span>
                            </div>
                            {job.deadline && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Deadline {formatDate(job.deadline)}</span>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            onClick={() => navigate(`/job/${job.id}`)}
                            className="ml-4"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i + 1)}
                    className="w-8 h-8 p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SavedJobsPage