import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, Users, Eye, Loader2, Calendar } from 'lucide-react'

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [selectedJobApplications, setSelectedJobApplications] = useState([])
  const [showApplications, setShowApplications] = useState(false)
  
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    skills: '',
    job_type: '',
    location: '',
    deadline: ''
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/jobs/my-jobs')
      setJobs(response.data.jobs)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobApplications = async (jobId) => {
    try {
      const response = await axios.get(`/jobs/${jobId}/applications`)
      setSelectedJobApplications(response.data.applications)
      setShowApplications(true)
    } catch (error) {
      console.error('Error fetching applications:', error)
      setError('Failed to fetch applications')
    }
  }

  const handleJobFormChange = (e) => {
    setJobForm({
      ...jobForm,
      [e.target.name]: e.target.value
    })
  }

  const handleJobTypeChange = (value) => {
    setJobForm({
      ...jobForm,
      job_type: value
    })
  }

  const resetJobForm = () => {
    setJobForm({
      title: '',
      description: '',
      skills: '',
      job_type: '',
      location: '',
      deadline: ''
    })
    setEditingJob(null)
  }

  const handleCreateJob = () => {
    resetJobForm()
    setShowJobForm(true)
  }

  const handleEditJob = (job) => {
    setJobForm({
      title: job.title,
      description: job.description,
      skills: job.skills.join(', '),
      job_type: job.job_type,
      location: job.location,
      deadline: job.deadline || ''
    })
    setEditingJob(job)
    setShowJobForm(true)
  }

  const handleSubmitJob = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...jobForm,
        skills: jobForm.skills
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill)
          .join(',') // Convert to comma-separated string
      }

      if (editingJob) {
        await axios.put(`/jobs/${editingJob.id}`, submitData)
      } else {
        await axios.post('/jobs', submitData)
      }

      setShowJobForm(false)
      resetJobForm()
      fetchJobs()
    } catch (error) {
      console.error('Error saving job:', error)
      setError(error.response?.data?.error || 'Failed to save job')
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`/jobs/${jobId}`)
        fetchJobs()
      } catch (error) {
        console.error('Error deleting job:', error)
        setError('Failed to delete job')
      }
    }
  }

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await axios.put(`/jobs/applications/${applicationId}/status`, { status })
      // Refresh applications for the current job
      const currentJob = jobs.find(job => 
        selectedJobApplications.some(app => app.job_id === job.id)
      )
      if (currentJob) {
        fetchJobApplications(currentJob.id)
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      setError('Failed to update application status')
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your job postings and applications</p>
        </div>
        <Button onClick={handleCreateJob}>
          <Plus className="mr-2 h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Job Listings */}
      <div className="grid gap-6">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
              <p className="text-gray-500 mb-4">Create your first job posting to start finding candidates</p>
              <Button onClick={handleCreateJob}>
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>{job.location}</span>
                      <span>{job.job_type}</span>
                      {job.deadline && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchJobApplications(job.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Applications
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditJob(job)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Job Form Dialog */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Job' : 'Post New Job'}</DialogTitle>
            <DialogDescription>
              {editingJob ? 'Update your job posting details' : 'Create a new job posting to find candidates'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitJob} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                required
                value={jobForm.title}
                onChange={handleJobFormChange}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                value={jobForm.description}
                onChange={handleJobFormChange}
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <Select value={jobForm.job_type} onValueChange={handleJobTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  required
                  value={jobForm.location}
                  onChange={handleJobFormChange}
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills (comma-separated)</Label>
              <Input
                id="skills"
                name="skills"
                value={jobForm.skills}
                onChange={handleJobFormChange}
                placeholder="e.g. JavaScript, React, Node.js"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline (Optional)</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={jobForm.deadline}
                onChange={handleJobFormChange}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowJobForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingJob ? 'Update Job' : 'Post Job'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={showApplications} onOpenChange={setShowApplications}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Job Applications</DialogTitle>
            <DialogDescription>
              Manage applications for this job posting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedJobApplications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No applications yet</p>
            ) : (
              selectedJobApplications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{application.applicant_name}</h4>
                        <p className="text-sm text-gray-600">{application.applicant_email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                        <Select
                          value={application.status}
                          onValueChange={(value) => updateApplicationStatus(application.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Applied">Applied</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmployerDashboard

