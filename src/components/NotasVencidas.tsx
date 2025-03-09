
import React from 'react';
import { useClientes } from '@/contexts/ClienteContext';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotasVencidas: React.FC = () => {
  const { clientesVencidos } = useClientes();
  const navigate = useNavigate();

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatarData = (data: Date | undefined) => {
    if (!data) return 'Sem data';
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const calcularDiasAtrasados = (data: Date | undefined) => {
    if (!data) return 0;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataVencimento = new Date(data);
    dataVencimento.setHours(0, 0, 0, 0);
    
    const diffTime = hoje.getTime() - dataVencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Ordenar notas vencidas da mais antiga para a mais recente
  const clientesVencidosOrdenados = [...clientesVencidos].sort((a, b) => {
    if (!a.dataVencimento || !b.dataVencimento) return 0;
    return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
  });

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg mb-4">Notas Vencidas ({clientesVencidosOrdenados.length})</h3>
      
      <div className="space-y-3">
        {clientesVencidosOrdenados.length > 0 ? (
          clientesVencidosOrdenados.map((cliente) => (
            <div 
              key={cliente.id} 
              className="card-fashion p-4 cursor-pointer hover:border-fashion-primary transition-all border-l-4 border-l-red-500"
              onClick={() => navigate(`/cliente/${cliente.id}`)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <User size={18} className="text-red-700" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-gray-800">{cliente.nome}</h3>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>Pendente: {formatarMoeda(cliente.valorPendente)}</span>
                      <span>•</span>
                      <span className="text-red-500 font-semibold">
                        Vencida há: {calcularDiasAtrasados(cliente.dataVencimento)} dias
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <Clock size={12} className="text-red-500" />
                      <span className="text-red-500">
                        Data: {formatarData(cliente.dataVencimento)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma nota vencida encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotasVencidas;
