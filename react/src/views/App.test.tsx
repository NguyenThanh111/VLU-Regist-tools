import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders the dashboard shell outside the landing route', () => {
  window.history.pushState({}, '', '/dashboard');
  render(<App />);

  expect(document.querySelector('.vlu-app')).toBeInTheDocument();
});
