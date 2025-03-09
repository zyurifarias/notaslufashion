
import React, { useState } from 'react';
import { useClientes } from '@/contexts/ClienteContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, User, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ListaClientes: React.FC = () => {
  const { clientesFiltrados, filtroNome, setFiltroNome } = useClientes();
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

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Função para verificar se a data está próxima do vencimento (3 dias)
  const proximoDoVencimento = (data: Date | undefined) => {
    if (!data) return false;
    
    const dataComp = new Date(data);
    dataComp.setHours(0, 0, 0, 0);
    
    const diffTime = dataComp.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 3;
  };

  // Verificar se uma nota está vencida
  const estaVencida = (data: Date | undefined, valorPendente: number) => {
    if (!data || valorPendente <= 0) return false;
    
    const dataComp = new Date(data);
    dataComp.setHours(0, 0, 0, 0);
    
    return dataComp < hoje;
  };

  // Ordenar clientes por data de criação (mais recentes primeiro)
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (a.transacoes.length === 0 || b.transacoes.length === 0) return 0;
    
    const dataA = new Date(a.transacoes[0].data).getTime();
    const dataB = new Date(b.transacoes[0].data).getTime();
    
    return dataB - dataA; // Mais recentes primeiro
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Pesquisar cliente..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="pl-10 input-fashion"
        />
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-3 mt-4">
        {clientesOrdenados.length > 0 ? (
          clientesOrdenados.map((cliente) => {
            const isProximoVencimento = proximoDoVencimento(cliente.dataVencimento);
            const isVencida = estaVencida(cliente.dataVencimento, cliente.valorPendente);
            
            return (
              <div 
                key={cliente.id} 
                className={`card-fashion p-4 cursor-pointer hover:border-fashion-primary transition-all ${
                  isVencida ? 'border-l-4 border-l-red-500' : 
                  isProximoVencimento ? 'border-l-4 border-l-amber-500' : ''
                }`}
                onClick={() => navigate(`/cliente/${cliente.id}`)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${
                      isVencida ? 'bg-red-100' :
                      isProximoVencimento ? 'bg-amber-100' : 
                      'bg-fashion-primary/20'
                    } flex items-center justify-center`}>
                      <User size={18} className={
                        isVencida ? 'text-red-700' :
                        isProximoVencimento ? 'text-amber-700' : 
                        'text-fashion-dark'
                      } />
                    </div>
                    <div>
                      <h3 className="font-sans font-medium text-gray-800">{cliente.nome}</h3>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>Total: {formatarMoeda(cliente.totalNota)}</span>
                        <span>•</span>
                        <span>Pendente: {formatarMoeda(cliente.valorPendente)}</span>
                      </div>
                      {cliente.dataVencimento && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <Clock size={12} className={
                            isVencida ? 'text-red-500' :
                            isProximoVencimento ? 'text-amber-500' : 
                            'text-gray-400'
                          } />
                          <span className={
                            isVencida ? 'text-red-500 font-medium' :
                            isProximoVencimento ? 'text-amber-500 font-medium' : 
                            'text-gray-400'
                          }>
                            {isVencida ? 'Vencida em: ' : 'Vence em: '} 
                            {formatarData(cliente.dataVencimento)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
            {filtroNome && (
              <button 
                onClick={() => setFiltroNome('')}
                className="text-sm text-fashion-secondary mt-2 hover:underline"
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaClientes;
