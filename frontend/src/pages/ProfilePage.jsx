import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, Image, Loader2, CheckCircle, User, Building } from 'lucide-react'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [profileData, setProfileData] = useState({
    email: '',
    // Job seeker fields
    first_name: '',
    last_name: '',
    phone: '',
    education: '',
    experience: '',
    // Employer fields
    company_name: '',
    company_description: '',
    company_website: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        education: user.education || '',
        experience: user.experience || '',
        company_name: user.company_name || '',
        company_description: user.company_description || '',
        company_website: user.company_website || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.put('/users/profile', profileData)
      updateUser(response.data.user)
      setSuccess('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const endpoint = type === 'resume' ? '/users/upload-resume' : '/users/upload-logo'
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setSuccess(`${type === 'resume' ? 'Resume' : 'Logo'} uploaded successfully!`)
      
      // Refresh user data
      const userResponse = await axios.get('/users/profile')
      updateUser(userResponse.data.user)
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error.response?.data?.error || `Failed to upload ${type}`)
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center">
            {user.role === 'job_seeker' ? <User className="mr-2 h-4 w-4" /> : <Building className="mr-2 h-4 w-4" />}
            Profile Information
          </TabsTrigger>
          {user.role === 'job_seeker' && (
            <TabsTrigger value="resume" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Resume
            </TabsTrigger>
          )}
          {user.role === 'employer' && (
            <TabsTrigger value="logo" className="flex items-center">
              <Image className="mr-2 h-4 w-4" />
              Company Logo
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>
                {user.role === 'job_seeker' ? 'Personal Information' : 'Company Information'}
              </CardTitle>
              <CardDescription>
                Update your {user.role === 'job_seeker' ? 'personal' : 'company'} details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {user.role === 'job_seeker' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={profileData.first_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={profileData.last_name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Textarea
                        id="education"
                        name="education"
                        value={profileData.education}
                        onChange={handleInputChange}
                        placeholder="Describe your educational background..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Work Experience</Label>
                      <Textarea
                        id="experience"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleInputChange}
                        placeholder="Describe your work experience..."
                        rows={4}
                      />
                    </div>
                  </>
                )}

                {user.role === 'employer' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={profileData.company_name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_description">Company Description</Label>
                      <Textarea
                        id="company_description"
                        name="company_description"
                        value={profileData.company_description}
                        onChange={handleInputChange}
                        placeholder="Describe your company..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_website">Company Website</Label>
                      <Input
                        id="company_website"
                        name="company_website"
                        value={profileData.company_website}
                        onChange={handleInputChange}
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                  </>
                )}

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === 'job_seeker' && (
          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
                <CardDescription>
                  Upload your resume to apply for jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.resume_filename && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800">
                          Current resume: {user.resume_filename}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="resume-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">
                          Click to upload a new resume
                        </span>
                        <Input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => handleFileUpload(e, 'resume')}
                          className="hidden"
                          disabled={uploading}
                        />
                      </Label>
                      <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX, or TXT files only
                      </p>
                    </div>
                  </div>

                  {uploading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Uploading resume...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user.role === 'employer' && (
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
                <CardDescription>
                  Upload your company logo to appear on job postings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.company_logo_filename && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <Image className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800">
                          Current logo: {user.company_logo_filename}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">
                          Click to upload a new logo
                        </span>
                        <Input
                          id="logo-upload"
                          type="file"
                          accept=".png,.jpg,.jpeg,.gif"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                          disabled={uploading}
                        />
                      </Label>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, JPEG, or GIF files only
                      </p>
                    </div>
                  </div>

                  {uploading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Uploading logo...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default ProfilePage

