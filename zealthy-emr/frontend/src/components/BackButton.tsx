import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ to, label = 'Back' }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  const onClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };
  return (
    <button onClick={onClick} aria-label={label}>{label}</button>
  );
}


