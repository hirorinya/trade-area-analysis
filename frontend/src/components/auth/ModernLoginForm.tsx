import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, MapPin, TrendingUp } from 'lucide-react';
import { theme } from '../../styles/theme.js';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface ModernLoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  loading?: boolean;
  error?: string;
}

const ModernLoginForm: React.FC<ModernLoginFormProps> = ({
  onLogin,
  onSwitchToRegister,
  loading = false,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

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
            Professional retail analytics with AI-powered insights
          </p>
        </div>

        {/* Login Card */}
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
              Welcome Back
            </h2>
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.gray[600],
              textAlign: 'center'
            }}>
              Sign in to your account to continue
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
                placeholder="Enter your password"
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

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={loading || !email || !password}
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
                  Signing In...
                </>
              ) : (
                'Sign In'
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
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.primary[600],
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign up for free
              </button>
            </p>
          </div>
        </Card>

        {/* Features Preview */}
        <div style={{
          marginTop: theme.spacing[8],
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing[4]
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            textAlign: 'center',
            color: 'white',
            backdropFilter: 'blur(10px)'
          }}>
            <TrendingUp size={24} style={{ marginBottom: theme.spacing[2] }} />
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium
            }}>
              AI-Powered Analytics
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            textAlign: 'center',
            color: 'white',
            backdropFilter: 'blur(10px)'
          }}>
            <MapPin size={24} style={{ marginBottom: theme.spacing[2] }} />
            <p style={{
              margin: 0,
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium
            }}>
              Professional Maps
            </p>
          </div>
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

export default ModernLoginForm;