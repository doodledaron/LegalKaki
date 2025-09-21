import { ApiResponse, ApiError } from "./types";

// Simulated network delay configuration
const NETWORK_DELAYS = {
  fast: 300, // 300ms - for simple operations
  medium: 800, // 800ms - for data fetching
  slow: 1500, // 1.5s - for analysis/processing
  upload: 2000, // 2s - for file uploads
  ai: 2500, // 2.5s - for AI responses
} as const;

// Error simulation configuration
const ERROR_SIMULATION = {
  enabled: false, // Set to true to simulate random errors
  rate: 0.1, // 10% chance of error when enabled
  networkErrorRate: 0.05, // 5% chance of network error
  serverErrorRate: 0.03, // 3% chance of server error
};

// Mock localStorage for data persistence
class MockStorage {
  private prefix = "legalkaki_mock_";

  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed to persist mock data:", error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(this.prefix)
    );
    keys.forEach((key) => localStorage.removeItem(key));
  }
}

export const mockStorage = new MockStorage();

// Utility functions
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldSimulateError(): {
  shouldError: boolean;
  errorType?: "network" | "server" | "validation";
} {
  if (!ERROR_SIMULATION.enabled) return { shouldError: false };

  const random = Math.random();

  if (random < ERROR_SIMULATION.networkErrorRate) {
    return { shouldError: true, errorType: "network" };
  }

  if (random < ERROR_SIMULATION.serverErrorRate) {
    return { shouldError: true, errorType: "server" };
  }

  if (random < ERROR_SIMULATION.rate) {
    return { shouldError: true, errorType: "validation" };
  }

  return { shouldError: false };
}

function generateError(type: "network" | "server" | "validation"): ApiError {
  const errors = {
    network: {
      error: "Network connection failed",
      code: "NETWORK_ERROR",
    },
    server: {
      error: "Internal server error",
      code: "SERVER_ERROR",
    },
    validation: {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    },
  };

  return {
    success: false,
    ...errors[type],
    timestamp: new Date().toISOString(),
  };
}

function generateApiResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    success: true,
    timestamp: new Date().toISOString(),
  };
}

// Progress tracking for long operations
type ProgressCallback = (progress: number, status: string) => void;

class ProgressTracker {
  private callbacks: Map<string, ProgressCallback> = new Map();

  register(id: string, callback: ProgressCallback): void {
    this.callbacks.set(id, callback);
  }

  unregister(id: string): void {
    this.callbacks.delete(id);
  }

  update(id: string, progress: number, status: string): void {
    const callback = this.callbacks.get(id);
    if (callback) {
      callback(progress, status);
    }
  }

  simulateProgress(id: string, totalDuration: number, steps: string[]): void {
    const stepDuration = totalDuration / steps.length;
    let currentStep = 0;

    const updateProgress = () => {
      if (currentStep < steps.length) {
        const progress = ((currentStep + 1) / steps.length) * 100;
        this.update(id, progress, steps[currentStep]);
        currentStep++;

        if (currentStep < steps.length) {
          setTimeout(updateProgress, stepDuration);
        }
      }
    };

    updateProgress();
  }
}

export const progressTracker = new ProgressTracker();

// Main MockClient class
export class MockClient {
  private baseDelay: number;

  constructor(baseDelay: number = NETWORK_DELAYS.medium) {
    this.baseDelay = baseDelay;
  }

  // Generic request method with error simulation
  async request<T>(
    operation: () => T | Promise<T>,
    delayType: keyof typeof NETWORK_DELAYS = "medium",
    options: {
      skipErrorSimulation?: boolean;
      successMessage?: string;
      progressId?: string;
      progressSteps?: string[];
    } = {}
  ): Promise<ApiResponse<T> | ApiError> {
    const { shouldError, errorType } = shouldSimulateError();

    // Simulate network delay
    const delayMs = NETWORK_DELAYS[delayType];

    // Start progress simulation if provided
    if (options.progressId && options.progressSteps) {
      progressTracker.simulateProgress(
        options.progressId,
        delayMs,
        options.progressSteps
      );
    }

    await delay(delayMs);

    // Return error if simulated
    if (shouldError && !options.skipErrorSimulation && errorType) {
      return generateError(errorType);
    }

    try {
      const result = await operation();
      const response = generateApiResponse(result);

      if (options.successMessage) {
        response.message = options.successMessage;
      }

      return response;
    } catch (error) {
      console.log("Error in request:", error);
      return generateError("server");
    }
  }

  // File upload simulation with progress
  async uploadFile(
    file: File,
    progressCallback?: (progress: number) => void
  ): Promise<ApiResponse<{ fileId: string; url: string }> | ApiError> {
    const fileId = `file_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Simulate upload progress
    if (progressCallback) {
      const steps = 10;
      const stepDelay = NETWORK_DELAYS.upload / steps;

      for (let i = 0; i <= steps; i++) {
        const progress = (i / steps) * 100;
        progressCallback(progress);
        await delay(stepDelay);

        // Check for error simulation during upload
        if (i === Math.floor(steps / 2)) {
          const { shouldError, errorType } = shouldSimulateError();
          if (shouldError && errorType) {
            return generateError(errorType);
          }
        }
      }
    } else {
      await delay(NETWORK_DELAYS.upload);
    }

    // Store file metadata in mock storage
    const fileData = {
      id: fileId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadDate: new Date(),
      url: URL.createObjectURL(file), // For demonstration purposes
    };

    const existingFiles = mockStorage.get("uploaded_files", []);
    mockStorage.set("uploaded_files", [...existingFiles, fileData]);

    return generateApiResponse({
      fileId,
      url: fileData.url,
    });
  }

  // AI processing simulation with streaming-like updates
  async processWithAI(
    input: string,
    type: "analysis" | "draft",
    progressCallback?: (stage: string, progress: number) => void
  ): Promise<ApiResponse<{ resultId: string; result: unknown }> | ApiError> {
    const resultId = `${type}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const stages =
      type === "analysis"
        ? [
            "Parsing input...",
            "Analyzing content...",
            "Identifying risks...",
            "Generating recommendations...",
            "Finalizing analysis...",
          ]
        : [
            "Understanding requirements...",
            "Generating draft...",
            "Reviewing content...",
            "Adding suggestions...",
            "Finalizing document...",
          ];

    if (progressCallback) {
      const stageDelay = NETWORK_DELAYS.ai / stages.length;

      for (let i = 0; i < stages.length; i++) {
        const progress = ((i + 1) / stages.length) * 100;
        progressCallback(stages[i], progress);
        await delay(stageDelay);

        // Simulate potential error during processing
        if (i === Math.floor(stages.length / 2)) {
          const { shouldError, errorType } = shouldSimulateError();
          if (shouldError && errorType === "server") {
            return generateError("server");
          }
        }
      }
    } else {
      await delay(NETWORK_DELAYS.ai);
    }

    // Store result in mock storage
    const result = {
      id: resultId,
      type,
      input,
      createdAt: new Date(),
    };

    const existingResults = mockStorage.get(`${type}_results`, []);
    mockStorage.set(`${type}_results`, [...existingResults, result]);

    return generateApiResponse({
      resultId,
      result,
    });
  }

  // Batch operation simulation
  async batchRequest<T>(
    operations: Array<() => T | Promise<T>>,
    options: {
      concurrency?: number;
      delayBetween?: number;
      stopOnError?: boolean;
    } = {}
  ): Promise<Array<ApiResponse<T> | ApiError>> {
    const {
      concurrency = 3,
      delayBetween = 100,
      stopOnError = false,
    } = options;
    const results: Array<ApiResponse<T> | ApiError> = [];

    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);

      const batchPromises = batch.map(async (operation) => {
        return this.request(operation, "fast");
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Check for errors if stopOnError is enabled
      if (stopOnError && batchResults.some((result) => !result.success)) {
        break;
      }

      // Delay between batches
      if (i + concurrency < operations.length && delayBetween > 0) {
        await delay(delayBetween);
      }
    }

    return results;
  }

  // WebSocket simulation for real-time updates
  createMockWebSocket(url: string): MockWebSocket {
    return new MockWebSocket(url);
  }
}

// Mock WebSocket for real-time updates
class MockWebSocket {
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {
    this.connect();
  }

  private async connect(): Promise<void> {
    await delay(NETWORK_DELAYS.fast);

    const { shouldError } = shouldSimulateError();
    if (shouldError && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.emit("error", new Error("Connection failed"));
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
      return;
    }

    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit("open");

    // Simulate periodic updates
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    const sendHeartbeat = () => {
      if (this.isConnected) {
        this.emit("message", {
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        });
        setTimeout(sendHeartbeat, 30000); // Every 30 seconds
      }
    };

    setTimeout(sendHeartbeat, 30000);
  }

  on(event: string, listener: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data?: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error("WebSocket listener error:", error);
        }
      });
    }
  }

  send(data: unknown): void {
    if (!this.isConnected) {
      throw new Error("WebSocket is not connected");
    }

    // Simulate server response after delay
    setTimeout(() => {
      this.emit("message", {
        type: "response",
        data,
        timestamp: new Date().toISOString(),
      });
    }, NETWORK_DELAYS.fast);
  }

  close(): void {
    this.isConnected = false;
    this.emit("close");
  }

  get readyState(): number {
    return this.isConnected ? 1 : 0; // 1 = OPEN, 0 = CONNECTING
  }
}

// Export default instance
export const mockClient = new MockClient();

// Utility functions for testing
export const mockUtils = {
  enableErrorSimulation: (enabled: boolean) => {
    ERROR_SIMULATION.enabled = enabled;
  },

  setErrorRates: (rates: Partial<typeof ERROR_SIMULATION>) => {
    Object.assign(ERROR_SIMULATION, rates);
  },

  clearMockStorage: () => {
    mockStorage.clear();
  },

  getMockStorageData: (key: string) => {
    return mockStorage.get(key, null);
  },

  setMockStorageData: (key: string, value: unknown) => {
    mockStorage.set(key, value);
  },
};
