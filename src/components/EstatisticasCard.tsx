
import React from 'react';
import { useClientes } from '@/contexts/ClienteContext';
import { ArrowDown, ArrowUp, PiggyBank } from 'lucide-react';

const EstatisticasCard: React.FC = () => {
  const { estatisticas } = useClientes();

  // Formatar para valor em reais
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="card-fashion p-4 flex items-center">
        <div className="h-10 w-10 rounded-full bg-fashion-primary/30 flex items-center justify-center mr-3">
          <PiggyBank size={20} className="text-fashion-dark" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Total em Notas</p>
          <p className="text-lg font-semibold">{formatarMoeda(estatisticas.totalNotas)}</p>
        </div>
      </div>
      
      <div className="card-fashion p-4 flex items-center">
        <div className="h-10 w-10 rounded-full bg-fashion-tertiary/30 flex items-center justify-center mr-3">
          <ArrowDown size={20} className="text-fashion-dark" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Valor Abatido</p>
          <p className="text-lg font-semibold">{formatarMoeda(estatisticas.totalAbatido)}</p>
        </div>
      </div>
      
      <div className="card-fashion p-4 flex items-center">
        <div className="h-10 w-10 rounded-full bg-fashion-secondary/30 flex items-center justify-center mr-3">
          <ArrowUp size={20} className="text-fashion-dark" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Valor Pendente</p>
          <p className="text-lg font-semibold">{formatarMoeda(estatisticas.totalPendente)}</p>
        </div>
      </div>
    </div>
  );
};

export default EstatisticasCard;
