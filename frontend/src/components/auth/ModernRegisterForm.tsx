import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, MapPin, User } from 'lucide-react';
import { theme } from '../../styles/theme.js';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface ModernRegisterFormProps {
  onRegister: (email: string, password: string, fullName: string) => void;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string;
}

const ModernRegisterForm: React.FC<ModernRegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  loading = false,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return; // Error will be shown by validation
    }
    
    onRegister(email, password, fullName);
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === '';
  const isFormValid = email && password && confirmPassword && fullName && passwordsMatch;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[700]} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[4],
      fontFamily: theme.typography.fontFamily.primary
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        zIndex: 0
      }} />

      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: theme.spacing[8],
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[4]
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing[3],
              boxShadow: theme.shadows.lg
            }}>
              <MapPin size={32} color={theme.colors.primary[500]} />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                lineHeight: '1.2'
              }}>
                Trade Area
              </h1>
              <p style={{
                margin: 0,
                fontSize: theme.typography.fontSize.lg,
                opacity: 0.9,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Analysis Platform
              </p>
            </div>
          </div>
          
          <p style={{
            margin: 0,
            fontSize: theme.typography.fontSize.base,
            opacity: 0.8,
            maxWidth: '300px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Join thousands of retailers making smarter location decisions
          </p>
        </div>

        {/* Register Card */}
        <Card padding="large">
          <div style={{ marginBottom: theme.spacing[6] }}>
            <h2 style={{
              margin: 0,
              marginBottom: theme.spacing[2],
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.gray[900],
              textAlign: 'center'
            }}>
              Create Your Account
            </h2>
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.gray[600],
              textAlign: 'center'
            }}>
              Start your free trial today
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: theme.colors.error[50],
              border: `1px solid ${theme.colors.error[200]}`,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[6]
            }}>
              <p style={{
                margin: 0,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.error[700],
                textAlign: 'center'
              }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              icon={<User size={16} />}
              disabled={loading}
            />

            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail size={16} />}
              disabled={loading}
            />

            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={<Lock size={16} />}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.gray[400],
                  marginTop: '1.5rem'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                icon={<Lock size={16} />}
                disabled={loading}
                error={!passwordsMatch && confirmPassword !== ''}
                helperText={!passwordsMatch && confirmPassword !== '' ? 'Passwords do not match' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.gray[400],
                  marginTop: '1.5rem'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div style={{
            marginTop: theme.spacing[6],
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.gray[600]
            }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.primary[600],
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </Card>

        {/* Terms */}
        <div style={{
          marginTop: theme.spacing[6],
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            fontSize: theme.typography.fontSize.xs,
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '320px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ModernRegisterForm;