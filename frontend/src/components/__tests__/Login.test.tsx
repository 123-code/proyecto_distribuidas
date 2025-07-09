import { render, screen } from '@testing-library/react';
import Login from '../Login';

test('renderiza el formulario de login', () => {
  render(<Login />);
  expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
}); 