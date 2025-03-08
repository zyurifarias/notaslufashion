
import React from 'react';
import { useParams } from 'react-router-dom';
import DetalheCliente from '@/components/DetalheCliente';
import Header from '@/components/Header';

const ClienteDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Cliente não encontrado</div>;
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Header />
      <div className="mt-6">
        <DetalheCliente clienteId={id} />
      </div>
    </div>
  );
};

export default ClienteDetalhe;
