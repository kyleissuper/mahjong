import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Prototype } from './Prototype.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Prototype />
  </StrictMode>,
);
