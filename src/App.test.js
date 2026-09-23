import { render, screen } from '@testing-library/react';
import App from './App';

test('renders DIARKES app title', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/DIARKES/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
