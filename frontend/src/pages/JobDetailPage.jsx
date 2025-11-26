import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, MapPin, Clock, Calendar, Building, Loader2, CheckCircle, Heart, HeartOff } from 'lucide-react'

const JobDetailPage = () => {
  const { id } = useParams()
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeUploadError, setResumeUploadError] = useState('')
  const applySectionRef = useRef(null)

  useEffect(() => {
    fetchJob()
    if (user && user.role === 'job_seeker') {
      checkApplicationStatus()
      checkSavedStatus()
    }
  }, [id, user])

  const fetchJob = async () => {
    try {
      const response = await axios.get(`/jobs/${id}`)
      setJob(response.data.job)
      // If user is logged in as job seeker, the API should include is_saved status
      if (response.data.job.is_saved !== undefined) {
        setIsSaved(response.data.job.is_saved)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      setError('Job not found')
    } finally {
      setLoading(false)
    }
  }

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get('/jobs/my-applications')
      const applications = response.data.applications
      const applied = applications.some(app => app.job_id === parseInt(id))
      setHasApplied(applied)
    } catch (error) {
      console.error('Error checking application status:', error)
    }
  }

  const checkSavedStatus = async () => {
    try {
      const response = await axios.get(`/jobs/${id}/is-saved`)
      setIsSaved(response.data.is_saved)
    } catch (error) {
      console.error('Error checking saved status:', error)
    }
  }

  const handleSaveJob = async () => {
    if (!user || user.role !== 'job_seeker') return
    
    try {
      setSavingJob(true)
      await axios.post(`/jobs/${id}/save`)
      setIsSaved(true)
      setSuccess('Job saved successfully!')
    } catch (error) {
      console.error('Error saving job:', error)
      setError('Failed to save job')
    } finally {
      setSavingJob(false)
    }
  }

  const handleUnsaveJob = async () => {
    if (!user || user.role !== 'job_seeker') return
    
    try {
      setSavingJob(true)
      await axios.delete(`/jobs/${id}/unsave`)
      setIsSaved(false)
      setSuccess('Job removed from saved list!')
    } catch (error) {
      console.error('Error unsaving job:', error)
      setError('Failed to unsave job')
    } finally {
      setSavingJob(false)
    }
  }

  const handleApply = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'job_seeker') {
      setError('Only job seekers can apply for jobs')
      return
    }

    setApplying(true)
    setError('')

    try {
      // If the user selected a resume file, upload it first
      if (resumeFile) {
        setResumeUploadError('')
        setResumeUploading(true)
        const formData = new FormData()
        formData.append('file', resumeFile)
        try {
          await axios.post('/users/upload-resume', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          // Refresh user profile so we have the filename available
          try {
            const profileResp = await axios.get('/users/profile')
            // update local auth user so UI can immediately show the uploaded resume
            if (profileResp?.data?.user && typeof updateUser === 'function') {
              updateUser(profileResp.data.user)
            }
          } catch (err) {
            // ignore profile refresh failure
          }
        } catch (err) {
          console.error('Resume upload failed', err)
          setResumeUploadError(err.response?.data?.error || 'Failed to upload resume')
          setResumeUploading(false)
          setApplying(false)
          return
        } finally {
          setResumeUploading(false)
        }
      }

      await axios.post(`/jobs/${id}/apply`, { cover_letter: coverLetter })
      setSuccess('Application submitted successfully!')
      setHasApplied(true)
    } catch (error) {
      console.error('Error applying for job:', error)
      setError(error.response?.data?.error || 'Failed to apply for job')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-4">{job.title}</CardTitle>
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  <span className="font-medium">{job.employer_name}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{job.job_type}</span>
                </div>
              </div>
              {job.deadline && (
                <div className="flex items-center text-gray-600 mb-4">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Application deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="ml-6 flex items-center space-x-3">
              {user && user.role === 'job_seeker' && (
                <>
                  {hasApplied ? (
                    <Badge className="bg-green-100 text-green-800 px-4 py-2">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Applied
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => {
                        // Scroll to application section instead of submitting immediately
                        if (applySectionRef.current) {
                          applySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                      disabled={applying}
                      size="lg"
                    >
                      {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {applying ? 'Preparing...' : 'Apply Now'}
                    </Button>
                  )}
                  
                  {/* Save/Unsave Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={isSaved ? handleUnsaveJob : handleSaveJob}
                    disabled={savingJob}
                    className={isSaved ? "text-red-600 border-red-600 hover:bg-red-50" : "text-gray-600 hover:text-red-600"}
                  >
                    {savingJob ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isSaved ? (
                      <Heart className="mr-2 h-4 w-4 fill-current" />
                    ) : (
                      <HeartOff className="mr-2 h-4 w-4" />
                    )}
                    {savingJob ? 'Saving...' : isSaved ? 'Saved' : 'Save Job'}
                  </Button>
                </>
              )}
              {!user && (
                <Button onClick={() => navigate('/login')} size="lg">
                  Login to Apply
                </Button>
              )}
              {user && user.role === 'employer' && (
                <Badge variant="outline" className="px-4 py-2">
                  Employer View
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Job Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>

            {job.skills && job.skills.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                  <div className="space-y-1">
                    <div>Job Type: {job.job_type}</div>
                    <div>Location: {job.location}</div>
                    {job.deadline && (
                      <div>Deadline: {new Date(job.deadline).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Posted</h4>
                  <div>{new Date(job.created_at).toLocaleDateString()}</div>
                  {job.updated_at !== job.created_at && (
                    <div className="text-xs">
                      Updated: {new Date(job.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {user && user.role === 'job_seeker' && !hasApplied && (
              <div className="border-t pt-6" ref={applySectionRef}>
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-medium text-blue-900 mb-2">Ready to apply?</h4>
                  <p className="text-blue-700 mb-4">
                    Make sure your profile is complete and your resume is up to date before applying.
                  </p>
                  <div className="space-y-4">
                    {/* Resume upload / selection */}
                    <div className="space-y-2">
                      {user?.resume_filename ? (
                        <div className="text-sm text-gray-700">
                          Current resume: 
                          <a
                            className="text-blue-600 underline ml-2"
                            href={`${config.API_BASE_URL.replace(/\/$/, '')}/users/resume/${user.resume_filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View resume
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">No resume uploaded yet.</div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          id="resume-file"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="text-sm"
                        />
                        {resumeFile && (
                          <div className="text-sm text-gray-700">Selected: {resumeFile.name}</div>
                        )}
                      </div>
                      {resumeUploadError && (
                        <Alert variant="destructive">
                          <AlertDescription>{resumeUploadError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <Textarea
                      placeholder="Write a short cover letter or message to the employer (optional)"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-3">
                      <Button onClick={handleApply} disabled={applying}>
                        {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {applying ? 'Applying...' : 'Apply for this Job'}
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/profile')}>
                        Update Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default JobDetailPage

