
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cliente, Transacao, EstatisticasGerais } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface ClienteContextType {
  clientes: Cliente[];
  estatisticas: EstatisticasGerais;
  filtroNome: string;
  setFiltroNome: (filtro: string) => void;
  adicionarCliente: (nome: string, valorNota: number, dataVencimento?: Date, telefone?: string) => Promise<string | undefined>; 
  removerCliente: (id: string) => void;
  adicionarValorNota: (clienteId: string, valor: number, descricao?: string, novaDataVencimento?: Date) => void;
  registrarPagamento: (clienteId: string, valor: number, descricao?: string, novaDataVencimento?: Date) => void;
  editarTransacao: (clienteId: string, transacaoId: string, novoValor: number, novaDescricao?: string) => void;
  removerTransacao: (clienteId: string, transacaoId: string) => void;
  getClienteById: (id: string) => Cliente | undefined;
  clientesFiltrados: Cliente[];
  atualizarDataVencimento: (clienteId: string, novaDataVencimento: Date) => void;
  atualizarTelefone: (clienteId: string, novoTelefone: string) => void;
  clientesVencidos: Cliente[];
  atualizarNomeCliente: (clienteId: string, novoNome: string) => void;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

export const useClientes = () => {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error('useClientes deve ser usado dentro de um ClienteProvider');
  }
  return context;
};

export const ClienteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroNome, setFiltroNome] = useState('');
  
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
        const clientesFormatados = data.map((cliente: any) => {
          const transacoes = cliente.transacoes || [];
          
          const transacoesFormatadas: Transacao[] = transacoes.map((t: any) => ({
            id: t.id,
            data: new Date(t.data_transacao),
            valor: t.valor,
            tipo: t.tipo,
            descricao: t.descricao
          })).sort((a: any, b: any) => b.data.getTime() - a.data.getTime());
          
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
            transacoes: transacoesFormatadas,
            dataVencimento: cliente.data_vencimento ? new Date(cliente.data_vencimento) : new Date(),
            telefone: cliente.telefone
          };
        });
        
        setClientes(clientesFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes. Por favor, tente novamente.');
      
      const dadosSalvos = localStorage.getItem('lufashion-clientes');
      if (dadosSalvos) {
        try {
          const clientesParsed = JSON.parse(dadosSalvos);
          setClientes(clientesParsed.map((cliente: any) => ({
            ...cliente,
            transacoes: cliente.transacoes.map((t: any) => ({
              ...t,
              data: new Date(t.data)
            })),
            dataVencimento: cliente.dataVencimento ? new Date(cliente.dataVencimento) : new Date()
          })));
        } catch (e) {
          console.error("Erro ao carregar dados do localStorage:", e);
        }
      }
    }
  };
  
  useEffect(() => {
    carregarClientes();
  }, []);
  
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
  
  const normalizarTexto = (texto: string): string => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };
  
  const clientesFiltrados = clientes.filter(cliente => {
    const nomeNormalizado = normalizarTexto(cliente.nome);
    const filtroNormalizado = normalizarTexto(filtroNome);
    return nomeNormalizado.includes(filtroNormalizado);
  });
  
  const clientesVencidos = clientes.filter(cliente => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataVencimento = cliente.dataVencimento ? new Date(cliente.dataVencimento) : null;
    if (!dataVencimento) return false;
    
    dataVencimento.setHours(0, 0, 0, 0);
    
    return dataVencimento < hoje && cliente.valorPendente > 0;
  }).sort((a, b) => {
    const dataA = a.dataVencimento ? new Date(a.dataVencimento).getTime() : 0;
    const dataB = b.dataVencimento ? new Date(b.dataVencimento).getTime() : 0;
    return dataA - dataB;
  });
  
  const adicionarCliente = async (nome: string, valorNota: number, dataVencimento?: Date, telefone?: string) => {
    if (!nome || valorNota <= 0) {
      toast.error("Por favor, preencha o nome e um valor válido.");
      return undefined;
    }
    
    const dataVenc = dataVencimento || new Date();
    
    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .insert([{
          nome,
          total_nota: valorNota,
          valor_pendente: valorNota,
          valor_abatido: 0,
          data_vencimento: dataVenc.toISOString().split('T')[0],
          telefone
        }])
        .select()
        .single();
      
      if (clienteError) throw clienteError;
      
      const novoClienteId = clienteData.id;
      
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          cliente_id: novoClienteId,
          valor: valorNota,
          tipo: 'adicao',
          descricao: 'Nota inicial'
        }]);
      
      if (transacaoError) throw transacaoError;
      
      await carregarClientes();
      
      toast.success(`Cliente ${nome} adicionado com sucesso!`);
      
      return novoClienteId;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error("Erro ao adicionar cliente. Por favor, tente novamente.");
      
      const novoClienteId = uuidv4();
      const novoCliente: Cliente = {
        id: novoClienteId,
        nome,
        totalNota: valorNota,
        valorPendente: valorNota,
        valorAbatido: 0,
        dataVencimento: dataVencimento || new Date(),
        telefone,
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
  
  const atualizarDataVencimento = async (clienteId: string, novaDataVencimento: Date) => {
    try {
      // Format the date correctly for Supabase (YYYY-MM-DD)
      const formattedDate = novaDataVencimento.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('clientes')
        .update({
          data_vencimento: formattedDate
        })
        .eq('id', clienteId);
      
      if (error) throw error;
      
      // Update the local state immediately
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            return {
              ...cliente,
              dataVencimento: new Date(novaDataVencimento)
            };
          }
          return cliente;
        })
      );
      
      toast.success("Data de vencimento atualizada com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar data de vencimento:', error);
      toast.error("Erro ao atualizar data de vencimento. Por favor, tente novamente.");
      
      // Still update the local state as a fallback
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            return {
              ...cliente,
              dataVencimento: novaDataVencimento
            };
          }
          return cliente;
        })
      );
    }
  };
  
  const atualizarTelefone = async (clienteId: string, novoTelefone: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          telefone: novoTelefone
        })
        .eq('id', clienteId);
      
      if (error) throw error;
      
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            return {
              ...cliente,
              telefone: novoTelefone
            };
          }
          return cliente;
        })
      );
      
      toast.success("Telefone atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
      toast.error("Erro ao atualizar telefone. Por favor, tente novamente.");
      
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            return {
              ...cliente,
              telefone: novoTelefone
            };
          }
          return cliente;
        })
      );
    }
  };
  
  const atualizarNomeCliente = async (clienteId: string, novoNome: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: novoNome
        })
        .eq('id', clienteId);
      
      if (error) throw error;
      
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            return {
              ...cliente,
              nome: novoNome
            };
          }
          return cliente;
        })
      );
      
      toast.success("Nome atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error("Erro ao atualizar nome. Por favor, tente novamente.");
      
      setClientes(prevClientes => 
        prevClientes.map(cliente => {
          if (cliente.id === clienteId) {
            return {
              ...cliente,
              nome: novoNome
            };
          }
          return cliente;
        })
      );
    }
  };
  
  const removerCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
      toast.success("Cliente removido com sucesso!");
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      toast.error("Erro ao remover cliente. Por favor, tente novamente.");
      
      setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
    }
  };
  
  const adicionarValorNota = async (clienteId: string, valor: number, descricao?: string, novaDataVencimento?: Date) => {
    if (valor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          cliente_id: clienteId,
          valor,
          tipo: 'adicao',
          descricao
        }]);
      
      if (transacaoError) throw transacaoError;
      
      const novoTotalNota = cliente.totalNota + valor;
      const novoValorPendente = cliente.valorPendente + valor;
      
      const updateData: any = {
        total_nota: novoTotalNota,
        valor_pendente: novoValorPendente
      };
      
      if (novaDataVencimento) {
        updateData.data_vencimento = novaDataVencimento.toISOString().split('T')[0];
      }
      
      const { error: clienteError } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', clienteId);
      
      if (clienteError) throw clienteError;
      
      await carregarClientes();
      
      toast.success("Valor adicionado com sucesso!");
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      toast.error("Erro ao adicionar valor. Por favor, tente novamente.");
      
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
              dataVencimento: novaDataVencimento || cliente.dataVencimento,
              transacoes: [novaTransacao, ...cliente.transacoes]
            };
          }
          return cliente;
        })
      );
    }
  };
  
  const registrarPagamento = async (clienteId: string, valor: number, descricao?: string, novaDataVencimento?: Date) => {
    if (valor <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }
    
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      const valorPagamento = Math.min(valor, cliente.valorPendente);
      
      if (valorPagamento <= 0) {
        toast.info("Não há valor pendente para pagamento.");
        return;
      }
      
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          cliente_id: clienteId,
          valor: valorPagamento,
          tipo: 'pagamento',
          descricao
        }]);
      
      if (transacaoError) throw transacaoError;
      
      const novoValorPendente = cliente.valorPendente - valorPagamento;
      const novoValorAbatido = cliente.valorAbatido + valorPagamento;
      
      const updateData: any = {
        valor_pendente: novoValorPendente,
        valor_abatido: novoValorAbatido
      };
      
      if (novaDataVencimento) {
        updateData.data_vencimento = novaDataVencimento.toISOString().split('T')[0];
      }
      
      const { error: clienteError } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', clienteId);
      
      if (clienteError) throw clienteError;
      
      await carregarClientes();
      
      toast.success("Pagamento registrado com sucesso!");
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error("Erro ao registrar pagamento. Por favor, tente novamente.");
      
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
              dataVencimento: novaDataVencimento || cliente.dataVencimento,
              transacoes: [novaTransacao, ...cliente.transacoes]
            };
          }
          return cliente;
        })
      );
    }
  };
  
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
      
      if (diferencaValor === 0 && novaDescricao === transacaoAntiga.descricao) {
        return;
      }
      
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .update({
          valor: novoValor,
          descricao: novaDescricao !== undefined ? novaDescricao : transacaoAntiga.descricao
        })
        .eq('id', transacaoId);
      
      if (transacaoError) throw transacaoError;
      
      if (diferencaValor !== 0) {
        let novoTotalNota = cliente.totalNota;
        let novoValorPendente = cliente.valorPendente;
        let novoValorAbatido = cliente.valorAbatido;
        
        if (transacaoAntiga.tipo === 'adicao') {
          novoTotalNota += diferencaValor;
          novoValorPendente += diferencaValor;
        } else {
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
      
      await carregarClientes();
      
      toast.success("Transação editada com sucesso!");
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      toast.error("Erro ao editar transação. Por favor, tente novamente.");
      
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
  
  const removerTransacao = async (clienteId: string, transacaoId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      const transacao = cliente.transacoes.find(t => t.id === transacaoId);
      if (!transacao) throw new Error("Transação não encontrada");
      
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId);
      
      if (transacaoError) throw transacaoError;
      
      let novoTotalNota = cliente.totalNota;
      let novoValorPendente = cliente.valorPendente;
      let novoValorAbatido = cliente.valorAbatido;
      
      if (transacao.tipo === 'adicao') {
        novoTotalNota -= transacao.valor;
        novoValorPendente -= transacao.valor;
      } else {
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
      
      await carregarClientes();
      
      toast.success("Transação removida com sucesso!");
    } catch (error) {
      console.error('Erro ao remover transação:', error);
      toast.error("Erro ao remover transação. Por favor, tente novamente.");
      
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
  
  const getClienteById = (id: string) => {
    return clientes.find(cliente => cliente.id === id);
  };
  
  useEffect(() => {
    setEstatisticas(calcularEstatisticas());
    
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
    clientesFiltrados,
    atualizarDataVencimento,
    atualizarTelefone,
    clientesVencidos,
    atualizarNomeCliente
  };
  
  return (
    <ClienteContext.Provider value={contextValue}>
      {children}
    </ClienteContext.Provider>
  );
};
