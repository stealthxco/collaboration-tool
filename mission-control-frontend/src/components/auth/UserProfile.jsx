import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Camera
} from 'lucide-react';
import { useProfile } from '../../hooks/useAuth';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { user, updateUserProfile, changeUserPassword, isLoading, error } = useProfile();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm();

  const newPassword = watchPassword('newPassword', '');

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileValue('firstName', user.firstName || '');
      setProfileValue('lastName', user.lastName || '');
      setProfileValue('email', user.email || '');
      setProfileValue('username', user.username || '');
    }
  }, [user, setProfileValue]);

  const handleProfileEdit = () => {
    setIsEditing(true);
    resetProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
    });
  };

  const handleProfileCancel = () => {
    setIsEditing(false);
    resetProfile();
  };

  const onProfileSubmit = async (data) => {
    const success = await updateUserProfile(data);
    if (success) {
      setIsEditing(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    const { currentPassword, newPassword } = data;
    const success = await changeUserPassword({
      currentPassword,
      newPassword,
    });
    
    if (success) {
      setShowPasswordForm(false);
      resetPassword();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            {!isEditing && (
              <button
                onClick={handleProfileEdit}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">@{user.username}</p>
                </div>
              </div>

              {/* User Stats */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>Last login {formatDate(user.lastLoginAt)}</span>
                  </div>
                )}
              </div>

              {/* Roles and Permissions */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {user.roles?.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              {isEditing ? (
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        {...registerProfile('firstName', {
                          required: 'First name is required',
                          minLength: { value: 2, message: 'Must be at least 2 characters' },
                        })}
                        type="text"
                        id="firstName"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          profileErrors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                      {profileErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        {...registerProfile('lastName', {
                          required: 'Last name is required',
                          minLength: { value: 2, message: 'Must be at least 2 characters' },
                        })}
                        type="text"
                        id="lastName"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          profileErrors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                      {profileErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      {...registerProfile('username', {
                        required: 'Username is required',
                        minLength: { value: 3, message: 'Must be at least 3 characters' },
                        pattern: {
                          value: /^[a-zA-Z0-9_-]+$/,
                          message: 'Username can only contain letters, numbers, underscores, and hyphens',
                        },
                      })}
                      type="text"
                      id="username"
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        profileErrors.username ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {profileErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address',
                        },
                      })}
                      type="email"
                      id="email"
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        profileErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleProfileCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2 inline" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2 inline" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Read-only Profile Info */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user.lastName}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>

                  {/* Change Password Section */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                    
                    {!showPasswordForm ? (
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </button>
                    ) : (
                      <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Current Password
                          </label>
                          <div className="mt-1 relative">
                            <input
                              {...registerPassword('currentPassword', {
                                required: 'Current password is required',
                              })}
                              type={showCurrentPassword ? 'text' : 'password'}
                              id="currentPassword"
                              className={`block w-full pr-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            New Password
                          </label>
                          <div className="mt-1 relative">
                            <input
                              {...registerPassword('newPassword', {
                                required: 'New password is required',
                                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                pattern: {
                                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                  message: 'Password must contain uppercase, lowercase, number, and special character',
                                },
                              })}
                              type={showNewPassword ? 'text' : 'password'}
                              id="newPassword"
                              className={`block w-full pr-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                          </label>
                          <div className="mt-1 relative">
                            <input
                              {...registerPassword('confirmNewPassword', {
                                required: 'Please confirm your new password',
                                validate: value => value === newPassword || 'Passwords do not match',
                              })}
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="confirmNewPassword"
                              className={`block w-full pr-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                passwordErrors.confirmNewPassword ? 'border-red-300' : 'border-gray-300'
                              }`}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.confirmNewPassword && (
                            <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmNewPassword.message}</p>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false);
                              resetPassword();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                                Updating...
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;