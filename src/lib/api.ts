import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ===================== PLAYER API =====================
export const playerAPI = {
  async createPlayer(data: any) {
    const response = await apiClient.post('/players/', data);
    return response.data.data;
  },

  async getPlayer(id: string) {
    const response = await apiClient.get(`/players/${id}`);
    return response.data.data;
  },

  async getAllPlayers(skip: number = 0, limit: number = 10, search?: string) {
    const params: any = { skip, limit };
    if (search) params.search = search;
    const response = await apiClient.get('/players/', { params });
    return response.data.data;
  },

  async updatePlayer(id: string, data: any) {
    const response = await apiClient.put(`/players/${id}`, data);
    return response.data.data;
  },

  async deletePlayer(id: string) {
    const response = await apiClient.delete(`/players/${id}`);
    return response.data.data;
  },

  async getPlayersByRole(role: string, skip: number = 0, limit: number = 10) {
    const response = await apiClient.get(`/players/role/${role}`, { params: { skip, limit } });
    return response.data.data;
  },
};

// ===================== TEAM API =====================
export const teamAPI = {
  async createTeam(data: any) {
    const response = await apiClient.post('/teams/', data);
    return response.data.data;
  },

  async createTeamWithLogo(formData: FormData) {
    const response = await apiClient.post('/teams/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getTeam(id: string) {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data.data;
  },

  async getAllTeams(skip: number = 0, limit: number = 10, search?: string) {
    const params: any = { skip, limit };
    if (search) params.search = search;
    const response = await apiClient.get('/teams/', { params });
    return response.data.data;
  },

  async updateTeam(id: string, data: any) {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data.data;
  },

  async deleteTeam(id: string) {
    const response = await apiClient.delete(`/teams/${id}`);
    return response.data.data;
  },

  async getTeamStats(id: string) {
    const response = await apiClient.get(`/teams/${id}/stats`);
    return response.data.data;
  },
};

// ===================== BID API =====================
export const bidAPI = {
  async createBid(data: any) {
    const response = await apiClient.post('/bids/', data);
    return response.data.data;
  },

  async getBid(id: string) {
    const response = await apiClient.get(`/bids/${id}`);
    return response.data.data;
  },

  async getBidsForPlayer(playerId: string, skip: number = 0, limit: number = 50) {
    const response = await apiClient.get(`/bids/player/${playerId}`, { params: { skip, limit } });
    return response.data.data;
  },

  async getBidsForTeam(teamId: string, skip: number = 0, limit: number = 50) {
    const response = await apiClient.get(`/bids/team/${teamId}`, { params: { skip, limit } });
    return response.data.data;
  },

  async getHighestBid(playerId: string) {
    const response = await apiClient.get(`/bids/player/${playerId}/highest`);
    return response.data.data;
  },

  async deleteBid(id: string) {
    const response = await apiClient.delete(`/bids/${id}`);
    return response.data.data;
  },
};

// ===================== AUCTION API =====================
export const auctionAPI = {
  async createAuctionPlayer(data: any) {
    const response = await apiClient.post('/auction/players', data);
    return response.data.data;
  },

  async getAuctionPlayer(id: string) {
    const response = await apiClient.get(`/auction/players/${id}`);
    return response.data.data;
  },

  async getAllAuctionPlayers(skip: number = 0, limit: number = 10) {
    const response = await apiClient.get('/auction/players', { params: { skip, limit } });
    return response.data.data;
  },

  async getAuctionPlayersByStatus(status: string, skip: number = 0, limit: number = 10) {
    const response = await apiClient.get(`/auction/players/status/${status}`, {
      params: { skip, limit },
    });
    return response.data.data;
  },

  async updateAuctionStatus(id: string, newStatus: string) {
    const response = await apiClient.put(`/auction/players/${id}/status/${newStatus}`);
    return response.data.data;
  },

  async finalizePlayerSale(playerId: string, teamId: string, salePrice: number) {
    const response = await apiClient.post(
      `/auction/players/${playerId}/finalize`,
      {},
      { params: { team_id: teamId, sale_price: salePrice } }
    );
    return response.data.data;
  },

  async markPlayerUnsold(playerId: string) {
    const response = await apiClient.put(`/auction/players/${playerId}/unsold`);
    return response.data.data;
  },

  async getAuctionSummary() {
    const response = await apiClient.get('/auction/summary');
    return response.data.data;
  },
};

// ===================== REGISTRATION API =====================
export const registrationAPI = {
  async createRegistration(data: any) {
    const response = await apiClient.post('/registrations/', data);
    return response.data.data;
  },

  async createRegistrationWithFile(formData: FormData) {
    const response = await apiClient.post('/registrations/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getRegistration(id: string) {
    const response = await apiClient.get(`/registrations/${id}`);
    return response.data.data;
  },

  async getAllRegistrations(skip: number = 0, limit: number = 10, status?: string) {
    const params: any = { skip, limit };
    if (status) params.status = status;
    const response = await apiClient.get('/registrations/', { params });
    return response.data.data;
  },

  async updateRegistration(id: string, data: any) {
    const response = await apiClient.put(`/registrations/${id}`, data);
    return response.data.data;
  },

  async deleteRegistration(id: string) {
    const response = await apiClient.delete(`/registrations/${id}`);
    return response.data.data;
  },

  async approveRegistration(id: string, paymentReference: string) {
    const response = await apiClient.post(`/registrations/${id}/approve`, null, {
      params: { payment_reference: paymentReference },
    });
    return response.data.data;
  },

  async rejectRegistration(id: string, rejectionReason: string) {
    const response = await apiClient.post(
      `/registrations/${id}/reject`,
      {},
      { params: { rejection_reason: rejectionReason } }
    );
    return response.data.data;
  },
};

// ===================== SETTINGS API =====================
export const settingsAPI = {
  async getSettings() {
    const response = await apiClient.get('/settings/');
    return response.data.data;
  },

  async updateRegistrationStatus(isOpen: boolean) {
    const response = await apiClient.put('/settings/registration-status', null, {
      params: { is_open: isOpen },
    });
    return response.data.data;
  },
};

export default apiClient;
