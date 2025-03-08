
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientes } from '@/contexts/ClienteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

const NovoClienteForm: React.FC = () => {
  const [nome, setNome] = useState('');
  const [valorNota, setValorNota] = useState('');
  const { adicionarCliente } = useClientes();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter para número e verificar se é válido
    const valor = parseFloat(valorNota.replace(',', '.'));
    
    if (!nome.trim()) {
      return; // Validação feita no contexto
    }
    
    const novoClienteId = adicionarCliente(nome.trim(), valor);
    
    // Limpar formulário
    setNome('');
    setValorNota('');
    
    // Redirecionar para a página de gerenciamento do cliente
    if (novoClienteId) {
      navigate(`/cliente/${novoClienteId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-fashion p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-fashion-primary/20 p-2 rounded-full">
          <UserPlus size={20} className="text-fashion-dark" />
        </div>
        <h2 className="text-lg font-serif font-medium">Nova Nota</h2>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Cliente</Label>
          <Input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite o nome do cliente"
            className="input-fashion"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="valor">Valor da Nota</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
            <Input
              id="valor"
              type="text"
              value={valorNota}
              onChange={(e) => {
                // Permitir apenas números e vírgula
                const value = e.target.value.replace(/[^\d,]/g, '');
                setValorNota(value);
              }}
              placeholder="0,00"
              className="pl-10 input-fashion"
              required
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full mt-4 btn-fashion-primary"
        >
          Criar Nova Nota
        </Button>
      </div>
    </form>
  );
};

export default NovoClienteForm;
