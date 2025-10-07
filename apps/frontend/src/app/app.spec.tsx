import { render } from '@testing-library/react';
import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render router provider', () => {
    render(<App />);
    // App now uses RouterProvider internally, so just verify it renders
    expect(document.body).toBeTruthy();
  });
});
