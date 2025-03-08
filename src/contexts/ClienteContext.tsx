import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cliente, Transacao, EstatisticasGerais } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Definição do contexto
interface ClienteContextType {
  clientes: Cliente[];
  estatisticas: EstatisticasGerais;
  filtroNome: string;
  setFiltroNome: (filtro: string) => void;
  adicionarCliente: (nome: string, valorNota: number) => void;
  removerCliente: (id: string) => void;
  adicionarValorNota: (clienteId: string, valor: number, descricao?: string) => void;
  registrarPagamento: (clienteId: string, valor: number, descricao?: string) => void;
  editarTransacao: (clienteId: string, transacaoId: string, novoValor: number, novaDescricao?: string) => void;
  removerTransacao: (clienteId: string, transacaoId: string) => void;
  getClienteById: (id: string) => Cliente | undefined;
  clientesFiltrados: Cliente[];
}

// Criação do contexto
const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useClientes = () => {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error('useClientes deve ser usado dentro de um ClienteProvider');
  }
  return context;
};

// Provider do contexto
export const ClienteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado para armazenar a lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const dadosSalvos = localStorage.getItem('lufashion-clientes');
    if (dadosSalvos) {
      try {
        const clientesParsed = JSON.parse(dadosSalvos);
        // Converter strings de data para objetos Date
        return clientesParsed.map((cliente: any) => ({
          ...cliente,
          transacoes: cliente.transacoes.map((t: any) => ({
            ...t,
            data: new Date(t.data)
          }))
        }));
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
        return [];
      }
    }
    return [];
  });
  
  // Estado para filtro de nomes
  const [filtroNome, setFiltroNome] = useState('');
  
  // Calcular estatísticas gerais
  const calcularEstatisticas = (): EstatisticasGerais => {
    return clientes.reduce(
      (stats, cliente) => {
        return {
          totalNotas: stats.totalNotas + cliente.totalNota,
          totalPendente: stats.totalPendente + cliente.valorPendente,
          totalAbatido: stats.totalAbatido + cliente.valorAbatido
        };
      },
      { totalNotas: 0, totalPendente: 0, totalAbatido: 0 }
    );
  };
  
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais>(
    calcularEstatisticas()
  );
  
  // Filtrar clientes pelo nome
  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );
  
  // Adicionar um novo cliente
  const adicionarCliente = (nome: string, valorNota: number) => {
    if (!nome || valorNota <= 0) {
      toast.error("Por favor, preencha o nome e um valor válido.");
      return;
    }
    
    const novoCliente: Cliente = {
      id: uuidv4(),
      nome,
      totalNota: valorNota,
      valorPendente: valorNota,
      valorAbatido: 0,
      transacoes: [
        {
          id: uuidv4(),
          data: new Date(),
          valor: valorNota,
          tipo: 'adicao',
          descricao: 'Nota inicial'
        }
      ]
    };
    
    setClientes(prevClientes => [...prevClientes, novoCliente]);
    toast.success(`Cliente ${nome} adicionado com sucesso!`);
  };
  
  // Remover um cliente
  const removerCliente = (id: string) => {
    setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
    toast.success("Cliente removido com sucesso!");
  };
  
  // Adicionar valor à nota de um cliente
  const adicionarValorNota = (clienteId: string, valor: number, descricao?: string) => {
    if (valor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    setClientes(prevClientes => 
      prevClientes.map(cliente => {
        if (cliente.id === clienteId) {
          const novaTransacao: Transacao = {
            id: uuidv4(),
            data: new Date(),
            valor,
            tipo: 'adicao',
            descricao
          };
          
          return {
            ...cliente,
            totalNota: cliente.totalNota + valor,
            valorPendente: cliente.valorPendente + valor,
            transacoes: [...cliente.transacoes, novaTransacao]
          };
        }
        return cliente;
      })
    );
    
    toast.success("Valor adicionado com sucesso!");
  };
  
  // Registrar um pagamento
  const registrarPagamento = (clienteId: string, valor: number, descricao?: string) => {
    if (valor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    setClientes(prevClientes => 
      prevClientes.map(cliente => {
        if (cliente.id === clienteId) {
          // Limitar o pagamento ao valor pendente
          const valorPagamento = Math.min(valor, cliente.valorPendente);
          
          if (valorPagamento <= 0) {
            toast.info("Não há valor pendente para pagamento.");
            return cliente;
          }
          
          const novaTransacao: Transacao = {
            id: uuidv4(),
            data: new Date(),
            valor: valorPagamento,
            tipo: 'pagamento',
            descricao
          };
          
          return {
            ...cliente,
            valorPendente: cliente.valorPendente - valorPagamento,
            valorAbatido: cliente.valorAbatido + valorPagamento,
            transacoes: [...cliente.transacoes, novaTransacao]
          };
        }
        return cliente;
      })
    );
    
    toast.success("Pagamento registrado com sucesso!");
  };
  
  // Editar uma transação
  const editarTransacao = (clienteId: string, transacaoId: string, novoValor: number, novaDescricao?: string) => {
    if (novoValor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    setClientes(prevClientes => 
      prevClientes.map(cliente => {
        if (cliente.id === clienteId) {
          const transacaoIndex = cliente.transacoes.findIndex(t => t.id === transacaoId);
          
          if (transacaoIndex === -1) return cliente;
          
          const transacaoAntiga = cliente.transacoes[transacaoIndex];
          const diferencaValor = novoValor - transacaoAntiga.valor;
          
          const novasTransacoes = [...cliente.transacoes];
          novasTransacoes[transacaoIndex] = {
            ...transacaoAntiga,
            valor: novoValor,
            descricao: novaDescricao !== undefined ? novaDescricao : transacaoAntiga.descricao
          };
          
          let novoTotalNota = cliente.totalNota;
          let novoValorPendente = cliente.valorPendente;
          let novoValorAbatido = cliente.valorAbatido;
          
          if (transacaoAntiga.tipo === 'adicao') {
            novoTotalNota += diferencaValor;
            novoValorPendente += diferencaValor;
          } else {
            // Pagamento
            novoValorPendente += transacaoAntiga.valor - novoValor;
            novoValorAbatido += novoValor - transacaoAntiga.valor;
          }
          
          return {
            ...cliente,
            totalNota: novoTotalNota,
            valorPendente: novoValorPendente,
            valorAbatido: novoValorAbatido,
            transacoes: novasTransacoes
          };
        }
        return cliente;
      })
    );
    
    toast.success("Transação editada com sucesso!");
  };
  
  // Remover uma transação
  const removerTransacao = (clienteId: string, transacaoId: string) => {
    setClientes(prevClientes => 
      prevClientes.map(cliente => {
        if (cliente.id === clienteId) {
          const transacao = cliente.transacoes.find(t => t.id === transacaoId);
          
          if (!transacao) return cliente;
          
          let novoTotalNota = cliente.totalNota;
          let novoValorPendente = cliente.valorPendente;
          let novoValorAbatido = cliente.valorAbatido;
          
          if (transacao.tipo === 'adicao') {
            novoTotalNota -= transacao.valor;
            novoValorPendente -= transacao.valor;
          } else {
            // Pagamento
            novoValorPendente += transacao.valor;
            novoValorAbatido -= transacao.valor;
          }
          
          return {
            ...cliente,
            totalNota: novoTotalNota,
            valorPendente: novoValorPendente,
            valorAbatido: novoValorAbatido,
            transacoes: cliente.transacoes.filter(t => t.id !== transacaoId)
          };
        }
        return cliente;
      })
    );
    
    toast.success("Transação removida com sucesso!");
  };
  
  // Obter um cliente pelo ID
  const getClienteById = (id: string) => {
    return clientes.find(cliente => cliente.id === id);
  };
  
  // Atualizar estatísticas quando os clientes mudarem
  useEffect(() => {
    setEstatisticas(calcularEstatisticas());
    
    // Salvar dados no localStorage
    localStorage.setItem('lufashion-clientes', JSON.stringify(clientes));
  }, [clientes]);
  
  const contextValue: ClienteContextType = {
    clientes,
    estatisticas,
    filtroNome,
    setFiltroNome,
    adicionarCliente,
    removerCliente,
    adicionarValorNota,
    registrarPagamento,
    editarTransacao,
    removerTransacao,
    getClienteById,
    clientesFiltrados
  };
  
  return (
    <ClienteContext.Provider value={contextValue}>
      {children}
    </ClienteContext.Provider>
  );
};
