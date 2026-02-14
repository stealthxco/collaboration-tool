import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';

// Mock fetch
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders Mission Control title', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        message: 'Mission Control Backend API',
        version: '1.0.0',
        environment: 'test',
      }),
    });

    render(<App />);
    
    expect(screen.getByText('🚀 Mission Control')).toBeInTheDocument();
    expect(screen.getByText('DevOps Infrastructure Management')).toBeInTheDocument();
  });

  it('displays backend status when API call succeeds', async () => {
    const mockStatus = {
      message: 'Mission Control Backend API',
      version: '1.0.0',
      environment: 'test',
    };

    fetch.mockResolvedValueOnce({
      json: async () => mockStatus,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Backend Status:')).toBeInTheDocument();
      expect(screen.getByText('Connected ✅')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('❌ Unable to connect to backend')).toBeInTheDocument();
    });
  });

  it('calls API again when refresh button is clicked', async () => {
    const mockStatus = {
      message: 'Mission Control Backend API',
      version: '1.0.0',
      environment: 'test',
    };

    fetch.mockResolvedValue({
      json: async () => mockStatus,
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected ✅')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('🔄 Refresh Status');
    await userEvent.click(refreshButton);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});