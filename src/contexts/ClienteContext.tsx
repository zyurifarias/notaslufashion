
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cliente, Transacao, EstatisticasGerais } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

// Definição do contexto
interface ClienteContextType {
  clientes: Cliente[];
  estatisticas: EstatisticasGerais;
  filtroNome: string;
  setFiltroNome: (filtro: string) => void;
  adicionarCliente: (nome: string, valorNota: number) => string | undefined;
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Estado para filtro de nomes
  const [filtroNome, setFiltroNome] = useState('');
  
  // Carregar clientes do Supabase
  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, transacoes(*)')
        .order('criado_em', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transformar os dados para o formato esperado pela aplicação
        const clientesFormatados = data.map((cliente: any) => {
          // Calcular os valores totais das transações
          const transacoes = cliente.transacoes || [];
          
          // Formatar as transações
          const transacoesFormatadas: Transacao[] = transacoes.map((t: any) => ({
            id: t.id,
            data: new Date(t.data_transacao),
            valor: t.valor,
            tipo: t.tipo,
            descricao: t.descricao
          })).sort((a: any, b: any) => b.data.getTime() - a.data.getTime());
          
          // Calcular os valores de nota, pendente e abatido
          const valorTotal = transacoesFormatadas
            .filter(t => t.tipo === 'adicao')
            .reduce((sum, t) => sum + t.valor, 0);
          
          const valorAbatido = transacoesFormatadas
            .filter(t => t.tipo === 'pagamento')
            .reduce((sum, t) => sum + t.valor, 0);
          
          return {
            id: cliente.id,
            nome: cliente.nome,
            totalNota: cliente.total_nota,
            valorPendente: cliente.valor_pendente,
            valorAbatido: cliente.valor_abatido,
            transacoes: transacoesFormatadas
          };
        });
        
        setClientes(clientesFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes. Por favor, tente novamente.');
      
      // Carregar do localStorage como fallback
      const dadosSalvos = localStorage.getItem('lufashion-clientes');
      if (dadosSalvos) {
        try {
          const clientesParsed = JSON.parse(dadosSalvos);
          setClientes(clientesParsed.map((cliente: any) => ({
            ...cliente,
            transacoes: cliente.transacoes.map((t: any) => ({
              ...t,
              data: new Date(t.data)
            }))
          })));
        } catch (e) {
          console.error("Erro ao carregar dados do localStorage:", e);
        }
      }
    }
  };
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarClientes();
  }, []);
  
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
  const adicionarCliente = async (nome: string, valorNota: number) => {
    if (!nome || valorNota <= 0) {
      toast.error("Por favor, preencha o nome e um valor válido.");
      return undefined;
    }
    
    try {
      // Criar o cliente no Supabase
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .insert([{
          nome,
          total_nota: valorNota,
          valor_pendente: valorNota,
          valor_abatido: 0
        }])
        .select()
        .single();
      
      if (clienteError) throw clienteError;
      
      const novoClienteId = clienteData.id;
      
      // Criar a transação inicial
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          cliente_id: novoClienteId,
          valor: valorNota,
          tipo: 'adicao',
          descricao: 'Nota inicial'
        }]);
      
      if (transacaoError) throw transacaoError;
      
      // Atualizar o estado local
      await carregarClientes();
      
      toast.success(`Cliente ${nome} adicionado com sucesso!`);
      
      return novoClienteId;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error("Erro ao adicionar cliente. Por favor, tente novamente.");
      
      // Fallback para armazenamento local se o Supabase falhar
      const novoClienteId = uuidv4();
      const novoCliente: Cliente = {
        id: novoClienteId,
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
      
      setClientes(prevClientes => [novoCliente, ...prevClientes]);
      return novoClienteId;
    }
  };
  
  // Remover um cliente
  const removerCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar o estado local
      setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
      toast.success("Cliente removido com sucesso!");
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      toast.error("Erro ao remover cliente. Por favor, tente novamente.");
      
      // Fallback para armazenamento local
      setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
    }
  };
  
  // Adicionar valor à nota de um cliente
  const adicionarValorNota = async (clienteId: string, valor: number, descricao?: string) => {
    if (valor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      // Criar a transação
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          cliente_id: clienteId,
          valor,
          tipo: 'adicao',
          descricao
        }]);
      
      if (transacaoError) throw transacaoError;
      
      // Atualizar o cliente
      const novoTotalNota = cliente.totalNota + valor;
      const novoValorPendente = cliente.valorPendente + valor;
      
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({
          total_nota: novoTotalNota,
          valor_pendente: novoValorPendente
        })
        .eq('id', clienteId);
      
      if (clienteError) throw clienteError;
      
      // Atualizar o estado local
      await carregarClientes();
      
      toast.success("Valor adicionado com sucesso!");
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      toast.error("Erro ao adicionar valor. Por favor, tente novamente.");
      
      // Fallback para armazenamento local
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
              transacoes: [novaTransacao, ...cliente.transacoes]
            };
          }
          return cliente;
        })
      );
    }
  };
  
  // Registrar um pagamento
  const registrarPagamento = async (clienteId: string, valor: number, descricao?: string) => {
    if (valor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      // Limitar o pagamento ao valor pendente
      const valorPagamento = Math.min(valor, cliente.valorPendente);
      
      if (valorPagamento <= 0) {
        toast.info("Não há valor pendente para pagamento.");
        return;
      }
      
      // Criar a transação
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          cliente_id: clienteId,
          valor: valorPagamento,
          tipo: 'pagamento',
          descricao
        }]);
      
      if (transacaoError) throw transacaoError;
      
      // Atualizar o cliente
      const novoValorPendente = cliente.valorPendente - valorPagamento;
      const novoValorAbatido = cliente.valorAbatido + valorPagamento;
      
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({
          valor_pendente: novoValorPendente,
          valor_abatido: novoValorAbatido
        })
        .eq('id', clienteId);
      
      if (clienteError) throw clienteError;
      
      // Atualizar o estado local
      await carregarClientes();
      
      toast.success("Pagamento registrado com sucesso!");
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error("Erro ao registrar pagamento. Por favor, tente novamente.");
      
      // Fallback para armazenamento local
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            const valorPagamento = Math.min(valor, cliente.valorPendente);
            
            if (valorPagamento <= 0) {
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
              transacoes: [novaTransacao, ...cliente.transacoes]
            };
          }
          return cliente;
        })
      );
    }
  };
  
  // Editar uma transação
  const editarTransacao = async (clienteId: string, transacaoId: string, novoValor: number, novaDescricao?: string) => {
    if (novoValor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      const transacaoIndex = cliente.transacoes.findIndex(t => t.id === transacaoId);
      if (transacaoIndex === -1) throw new Error("Transação não encontrada");
      
      const transacaoAntiga = cliente.transacoes[transacaoIndex];
      const diferencaValor = novoValor - transacaoAntiga.valor;
      
      // Não há mudança no valor
      if (diferencaValor === 0 && novaDescricao === transacaoAntiga.descricao) {
        return;
      }
      
      // Atualizar a transação
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .update({
          valor: novoValor,
          descricao: novaDescricao !== undefined ? novaDescricao : transacaoAntiga.descricao
        })
        .eq('id', transacaoId);
      
      if (transacaoError) throw transacaoError;
      
      // Atualizar o cliente se o valor mudou
      if (diferencaValor !== 0) {
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
        
        const { error: clienteError } = await supabase
          .from('clientes')
          .update({
            total_nota: novoTotalNota,
            valor_pendente: novoValorPendente,
            valor_abatido: novoValorAbatido
          })
          .eq('id', clienteId);
        
        if (clienteError) throw clienteError;
      }
      
      // Atualizar o estado local
      await carregarClientes();
      
      toast.success("Transação editada com sucesso!");
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      toast.error("Erro ao editar transação. Por favor, tente novamente.");
      
      // Fallback para armazenamento local
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
    }
  };
  
  // Remover uma transação
  const removerTransacao = async (clienteId: string, transacaoId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      const transacao = cliente.transacoes.find(t => t.id === transacaoId);
      if (!transacao) throw new Error("Transação não encontrada");
      
      // Excluir a transação
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId);
      
      if (transacaoError) throw transacaoError;
      
      // Atualizar o cliente
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
      
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({
          total_nota: novoTotalNota,
          valor_pendente: novoValorPendente,
          valor_abatido: novoValorAbatido
        })
        .eq('id', clienteId);
      
      if (clienteError) throw clienteError;
      
      // Atualizar o estado local
      await carregarClientes();
      
      toast.success("Transação removida com sucesso!");
    } catch (error) {
      console.error('Erro ao remover transação:', error);
      toast.error("Erro ao remover transação. Por favor, tente novamente.");
      
      // Fallback para armazenamento local
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
    }
  };
  
  // Obter um cliente pelo ID
  const getClienteById = (id: string) => {
    return clientes.find(cliente => cliente.id === id);
  };
  
  // Atualizar estatísticas quando os clientes mudarem
  useEffect(() => {
    setEstatisticas(calcularEstatisticas());
    
    // Salvar dados no localStorage como backup
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
