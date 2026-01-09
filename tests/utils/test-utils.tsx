import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock contexts
const MockAuthContext = React.createContext({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    role: 'Owner' as const,
  },
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

const MockTripContext = React.createContext({
  trips: [],
  currentTrip: null,
  isLoading: false,
  addTrip: async () => '',
  updateTrip: async () => {},
  deleteTrip: async () => {},
  setCurrentTrip: () => {},
});

const MockNotificationContext = React.createContext({
  notifications: [],
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    tripReminders: true,
    documentAlerts: true,
    budgetAlerts: true,
    calendarSync: true,
  },
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  clearAll: () => {},
  updatePreferences: () => {},
});

interface AllProvidersProps {
  children: React.ReactNode;
}

// Wrapper with all providers
function AllProviders({ children }: AllProvidersProps) {
  return (
    <MockAuthContext.Provider
      value={{
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          avatar: 'https://example.com/avatar.jpg',
          role: 'Owner' as const,
        },
        isAuthenticated: true,
        isLoading: false,
        login: async () => {},
        logout: () => {},
        updateUser: () => {},
      }}
    >
      <MockTripContext.Provider
        value={{
          trips: [],
          currentTrip: null,
          isLoading: false,
          addTrip: async () => '',
          updateTrip: async () => {},
          deleteTrip: async () => {},
          setCurrentTrip: () => {},
        }}
      >
        <MockNotificationContext.Provider
          value={{
            notifications: [],
            preferences: {
              emailNotifications: true,
              pushNotifications: true,
              tripReminders: true,
              documentAlerts: true,
              budgetAlerts: true,
              calendarSync: true,
            },
            addNotification: () => {},
            removeNotification: () => {},
            markAsRead: () => {},
            clearAll: () => {},
            updatePreferences: () => {},
          }}
        >
          {children}
        </MockNotificationContext.Provider>
      </MockTripContext.Provider>
    </MockAuthContext.Provider>
  );
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Accessibility testing helper
export async function checkAccessibility(container: HTMLElement) {
  // Basic accessibility checks
  const issues: string[] = [];

  // Check for missing alt attributes on images
  const images = container.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.getAttribute('alt')) {
      issues.push(`Image #${index + 1} is missing alt attribute`);
    }
  });

  // Check for missing labels on inputs
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);

    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      const type = input.getAttribute('type') || input.tagName.toLowerCase();
      issues.push(`${type} input #${index + 1} is missing accessible label`);
    }
  });

  // Check for buttons without accessible names
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const ariaLabelledBy = button.getAttribute('aria-labelledby');

    if (!hasText && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Button #${index + 1} is missing accessible name`);
    }
  });

  // Check for proper heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push(`Heading h${level} skips level (previous was h${lastLevel})`);
    }
    lastLevel = level;
  });

  // Check for links without href
  const links = container.querySelectorAll('a');
  links.forEach((link, index) => {
    if (!link.getAttribute('href')) {
      issues.push(`Link #${index + 1} is missing href attribute`);
    }
  });

  return issues;
}

// Form testing helpers
export const fillInput = async (
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  value: string
) => {
  await user.clear(element);
  await user.type(element, value);
};

export const selectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  selectElement: HTMLElement,
  optionText: string
) => {
  await user.selectOptions(selectElement, optionText);
};

// Wait helper for async operations
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
