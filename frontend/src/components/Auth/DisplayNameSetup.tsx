import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Check, AlertCircle } from 'lucide-react';

interface DisplayNameSetupProps {
  onComplete: () => void;
}

const DisplayNameSetup: React.FC<DisplayNameSetupProps> = ({ onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const { user, session } = useAuth();

  const validateDisplayName = (name: string) => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50 && /^[a-zA-Z0-9_\s-]+$/.test(trimmed);
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    setIsValid(validateDisplayName(value));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      // Update user profile with display name
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      onComplete();
    } catch (err) {
      setError('Failed to save display name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Display Name</h2>
            <p className="text-gray-600 mt-2">
              This is how other users will see you in the app
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  placeholder="Enter your display name"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    displayName && !isValid
                      ? 'border-red-300 focus:ring-red-500'
                      : displayName && isValid
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-300'
                  }`}
                  maxLength={50}
                />
                {displayName && isValid && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                <p>• 2-50 characters</p>
                <p>• Letters, numbers, spaces, hyphens, and underscores only</p>
                <p>• This will be visible to other users</p>
              </div>

              {displayName && !isValid && (
                <p className="mt-2 text-sm text-red-600">
                  Display name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              You can change this later in your profile settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayNameSetup;
