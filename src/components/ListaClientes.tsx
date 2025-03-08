
import React from 'react';
import { useClientes } from '@/contexts/ClienteContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, User, ChevronRight } from 'lucide-react';

const ListaClientes: React.FC = () => {
  const { clientesFiltrados, filtroNome, setFiltroNome } = useClientes();
  const navigate = useNavigate();

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

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

      <div className="space-y-3 mt-4">
        {clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((cliente) => (
            <div 
              key={cliente.id} 
              className="card-fashion p-4 cursor-pointer hover:border-fashion-primary transition-all"
              onClick={() => navigate(`/cliente/${cliente.id}`)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-fashion-primary/20 flex items-center justify-center">
                    <User size={18} className="text-fashion-dark" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-gray-800">{cliente.nome}</h3>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>Total: {formatarMoeda(cliente.totalNota)}</span>
                      <span>•</span>
                      <span>Pendente: {formatarMoeda(cliente.valorPendente)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))
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
