'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GitHubApiClient } from '@/lib/github/GitHubApiClient';
import { AuthResult } from '@/types/github';
import { GitHubConnection, GitHubUser } from '@/types/storage';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

interface GitHubAuthContextType {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  connection: GitHubConnection | null;
  apiClient: GitHubApiClient | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  handleAuthCallback: (code: string) => Promise<AuthResult>;
}

const GitHubAuthContext = createContext<GitHubAuthContextType | undefined>(undefined);

interface GitHubAuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'github_connection';
const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

export function GitHubAuthProvider({ children }: GitHubAuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [connection, setConnection] = useState<GitHubConnection | null>(null);
  const [apiClient, setApiClient] = useState<GitHubApiClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageManager = LocalStorageManager.getInstance();

  // Load saved connection on mount
  useEffect(() => {
    loadSavedConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await storageManager.load<GitHubConnection>(STORAGE_KEY);
      
      if (result.success && result.data) {
        const savedConnection = result.data;
        
        // Check if token is expired
        if (savedConnection.expiresAt && new Date() > savedConnection.expiresAt) {
          // Token expired, clear it
          await storageManager.remove(STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        // Validate token by making a test API call
        const client = new GitHubApiClient(savedConnection.accessToken);
        
        try {
          const currentUser = await client.getCurrentUser();
          
          // Map GitHub API user to storage user format
          const mappedUser: GitHubUser = {
            id: currentUser.id,
            login: currentUser.login,
            name: currentUser.name,
            email: currentUser.email,
            avatarUrl: currentUser.avatar_url,
          };
          
          // Update connection with fresh user data
          const updatedConnection = {
            ...savedConnection,
            user: mappedUser,
          };

          setConnection(updatedConnection);
          setUser(mappedUser);
          setApiClient(client);
          setIsAuthenticated(true);

          // Save updated connection
          await storageManager.save(STORAGE_KEY, updatedConnection);
        } catch {
          // Token is invalid, clear it
          await storageManager.remove(STORAGE_KEY);
          setError('Saved authentication token is invalid');
        }
      } else if (result.error?.code === 'NOT_FOUND') {
        // No saved connection found, but that's okay - user needs to authenticate
        console.log('No saved GitHub connection found');
      } else {
        // There was an actual error loading the connection
        console.error('Error loading saved connection:', result.error);
        setError(result.error?.message || 'Failed to load authentication');
      }
    } catch (err) {
      console.error('Error loading saved connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    if (!CLIENT_ID) {
      setError('GitHub Client ID not configured. Please check your environment variables.');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Clear any existing state to prevent conflicts
    sessionStorage.removeItem('github_oauth_state');

    const scope = 'repo,user,read:org';
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store state for validation
    sessionStorage.setItem('github_oauth_state', state);

    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    console.log('Initiating GitHub OAuth:', { clientId: CLIENT_ID, redirectUri, state });
    
    // Small delay to ensure sessionStorage is set before redirect
    setTimeout(() => {
      window.location.href = authUrl;
    }, 100);
  };

  const handleAuthCallback = async (code: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const client = new GitHubApiClient();
      const result = await client.authenticate(code);

      if (result.success && result.connection) {
        // Map GitHub API connection to storage format
        const mappedUser: GitHubUser = {
          id: result.connection.user.id,
          login: result.connection.user.login,
          name: result.connection.user.name,
          email: result.connection.user.email,
          avatarUrl: result.connection.user.avatar_url,
        };

        const storageConnection: GitHubConnection = {
          accessToken: result.connection.access_token,
          refreshToken: result.connection.refresh_token,
          expiresAt: result.connection.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
          scopes: result.connection.scopes,
          user: mappedUser,
        };

        setConnection(storageConnection);
        setUser(mappedUser);
        setApiClient(client);
        setIsAuthenticated(true);

        // Save connection to storage
        await storageManager.save(STORAGE_KEY, storageConnection);
      } else {
        setError(result.error || 'Authentication failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear stored connection
      await storageManager.remove(STORAGE_KEY);
      
      // Clear session storage
      sessionStorage.removeItem('github_oauth_state');

      // Reset state
      setConnection(null);
      setUser(null);
      setApiClient(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const value: GitHubAuthContextType = {
    isAuthenticated,
    user,
    connection,
    apiClient,
    isLoading,
    error,
    login,
    logout,
    handleAuthCallback,
  };

  return (
    <GitHubAuthContext.Provider value={value}>
      {children}
    </GitHubAuthContext.Provider>
  );
}

export function useGitHubAuth(): GitHubAuthContextType {
  const context = useContext(GitHubAuthContext);
  if (context === undefined) {
    throw new Error('useGitHubAuth must be used within a GitHubAuthProvider');
  }
  return context;
}