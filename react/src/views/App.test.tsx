import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders the VLU application shell', () => {
  render(<App />);

  expect(document.querySelector('.vlu-app')).toBeInTheDocument();
});
