import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientes } from '@/contexts/ClienteContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  ShoppingBag,
  Calendar as CalendarIcon,
  Phone,
  MessageSquare
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DetalheClienteProps {
  clienteId: string;
}

const DetalheCliente: React.FC<DetalheClienteProps> = ({ clienteId }) => {
  const { 
    getClienteById, 
    removerCliente, 
    adicionarValorNota, 
    registrarPagamento,
    editarTransacao,
    removerTransacao,
    atualizarDataVencimento,
    atualizarTelefone,
    atualizarNomeCliente
  } = useClientes();
  const navigate = useNavigate();
  
  const [valorAdicao, setValorAdicao] = useState('');
  const [descricaoAdicao, setDescricaoAdicao] = useState('');
  const [dataVencimentoAdicao, setDataVencimentoAdicao] = useState<Date | undefined>(undefined);
  
  const [valorPagamento, setValorPagamento] = useState('');
  const [descricaoPagamento, setDescricaoPagamento] = useState('');
  const [dataVencimentoPagamento, setDataVencimentoPagamento] = useState<Date | undefined>(undefined);
  
  const [transacaoEditando, setTransacaoEditando] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState('');
  const [descricaoEditando, setDescricaoEditando] = useState('');
  
  const [editandoTelefone, setEditandoTelefone] = useState(false);
  const [novoTelefone, setNovoTelefone] = useState('');
  
  const [editandoDataVencimento, setEditandoDataVencimento] = useState(false);
  const [novaDataVencimento, setNovaDataVencimento] = useState<Date | undefined>(undefined);
  
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const cliente = getClienteById(clienteId);
  
  if (!cliente) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">Cliente não encontrado</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="btn-fashion-outline"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Button>
      </div>
    );
  }
  
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  const formatarData = (data: Date) => {
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  const handleAdicionarValor = () => {
    const valor = parseFloat(valorAdicao.replace(',', '.'));
    adicionarValorNota(clienteId, valor, descricaoAdicao, dataVencimentoAdicao);
    setValorAdicao('');
    setDescricaoAdicao('');
    setDataVencimentoAdicao(undefined);
  };
  
  const handleRegistrarPagamento = () => {
    const valor = parseFloat(valorPagamento.replace(',', '.'));
    registrarPagamento(clienteId, valor, descricaoPagamento, dataVencimentoPagamento);
    setValorPagamento('');
    setDescricaoPagamento('');
    setDataVencimentoPagamento(undefined);
  };
  
  const iniciarEdicao = (transacao: { id: string, valor: number, descricao?: string }) => {
    setTransacaoEditando(transacao.id);
    setValorEditando(transacao.valor.toString().replace('.', ','));
    setDescricaoEditando(transacao.descricao || '');
  };
  
  const salvarEdicao = (transacaoId: string) => {
    const valor = parseFloat(valorEditando.replace(',', '.'));
    editarTransacao(clienteId, transacaoId, valor, descricaoEditando);
    cancelarEdicao();
  };
  
  const cancelarEdicao = () => {
    setTransacaoEditando(null);
    setValorEditando('');
    setDescricaoEditando('');
  };
  
  const handleSalvarTelefone = () => {
    if (novoTelefone.trim()) {
      atualizarTelefone(clienteId, novoTelefone);
    }
    setEditandoTelefone(false);
  };
  
  const handleSalvarDataVencimento = () => {
    if (novaDataVencimento) {
      atualizarDataVencimento(clienteId, novaDataVencimento);
      setForceUpdate(prev => prev + 1);
    }
    setEditandoDataVencimento(false);
  };
  
  const handleSalvarNome = () => {
    if (novoNome.trim()) {
      atualizarNomeCliente(clienteId, novoNome);
    }
    setEditandoNome(false);
  };
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataVencimento = cliente.dataVencimento ? new Date(cliente.dataVencimento) : new Date();
  dataVencimento.setHours(0, 0, 0, 0);
  
  const isVencida = dataVencimento < hoje && cliente.valorPendente > 0;
  
  const formatarTelefone = (value: string) => {
    if (!value) return '';
    
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      let formatted = numbers;
      
      if (numbers.length > 2) {
        formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
      }
      
      if (numbers.length > 7) {
        formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
      }
      
      return formatted;
    }
    
    return value;
  };
  
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbersOnly = input.replace(/\D/g, '');
    
    if (numbersOnly.length <= 11) {
      setNovoTelefone(formatarTelefone(numbersOnly));
    }
  };
  
  const getWhatsAppNumber = () => {
    if (!cliente.telefone) return '';
    return cliente.telefone.replace(/\D/g, '');
  };
  
  const getWhatsAppLink = () => {
    const phoneNumber = getWhatsAppNumber();
    if (!phoneNumber) return '#';
    return `https://wa.me/55${phoneNumber}?text=Olá,%20sua%20nota%20venceu.`;
  };
  
  const handleSelectDataVencimento = (date: Date | undefined) => {
    if (date) {
      setNovaDataVencimento(date);
      atualizarDataVencimento(clienteId, date);
      setForceUpdate(prev => prev + 1);
      setEditandoDataVencimento(false);
    }
  };
  
  const handleSelectDataVencimentoAdicao = (date: Date | undefined) => {
    setDataVencimentoAdicao(date);
  };
  
  const handleSelectDataVencimentoPagamento = (date: Date | undefined) => {
    setDataVencimentoPagamento(date);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="btn-fashion-outline"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 size={16} className="mr-2" />
              Excluir Cliente
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá excluir permanentemente o cliente
                {cliente.nome && <span className="font-semibold"> {cliente.nome} </span>}
                e todos os seus dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  removerCliente(clienteId);
                  navigate('/');
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="card-fashion p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-fashion-primary/20 flex items-center justify-center">
            <ShoppingBag size={18} className="text-fashion-dark" />
          </div>
          <div className="flex-1">
            {editandoNome ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="input-fashion"
                />
                <button 
                  onClick={handleSalvarNome}
                  className="text-green-600 hover:text-green-700 p-1"
                >
                  <Save size={16} />
                </button>
                <button 
                  onClick={() => setEditandoNome(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-sans font-medium">{cliente.nome}</h2>
                <button 
                  onClick={() => {
                    setNovoNome(cliente.nome);
                    setEditandoNome(true);
                  }}
                  className="text-fashion-dark/70 hover:text-fashion-dark p-1"
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Nota criada em {cliente.transacoes.length > 0 ? formatarData(cliente.transacoes[0].data) : '-'}
            </p>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="card-fashion p-4 bg-fashion-light">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Telefone</p>
                {editandoTelefone ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                      <Input
                        type="text"
                        value={novoTelefone}
                        onChange={handleTelefoneChange}
                        placeholder="(99) 99999-9999"
                        className="pl-10 input-fashion w-40"
                      />
                    </div>
                    <button 
                      onClick={handleSalvarTelefone}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                      onClick={() => setEditandoTelefone(false)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{cliente.telefone ? formatarTelefone(cliente.telefone) : 'Não informado'}</p>
                    <button 
                      onClick={() => {
                        setNovoTelefone(cliente.telefone || '');
                        setEditandoTelefone(true);
                      }}
                      className="text-fashion-dark/70 hover:text-fashion-dark p-1"
                    >
                      <Edit size={16} />
                    </button>
                    {cliente.telefone && (
                      <a 
                        href={getWhatsAppLink()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 p-1"
                        aria-label="Enviar mensagem no WhatsApp"
                      >
                        <MessageSquare size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={`card-fashion p-4 ${isVencida ? 'bg-red-50 border-red-200' : 'bg-fashion-light'}`}>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Data de Vencimento</p>
                {editandoDataVencimento ? (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[240px] justify-start text-left font-normal input-fashion"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {novaDataVencimento ? (
                            format(novaDataVencimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={novaDataVencimento}
                          onSelect={handleSelectDataVencimento}
                          initialFocus
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-medium ${isVencida ? 'text-red-600' : ''}`}>
                      {cliente.dataVencimento ? formatarData(cliente.dataVencimento) : 'Não definida'}
                      {isVencida && ' (VENCIDA)'}
                    </p>
                    <button 
                      onClick={() => {
                        setNovaDataVencimento(cliente.dataVencimento || new Date());
                        setEditandoDataVencimento(true);
                      }}
                      className="text-fashion-dark/70 hover:text-fashion-dark p-1"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card-fashion p-4 bg-fashion-light">
            <p className="text-sm text-gray-500 mb-1">Valor Total da Nota</p>
            <p className="text-xl font-semibold">{formatarMoeda(cliente.totalNota)}</p>
          </div>
          
          <div className="card-fashion p-4 bg-fashion-light">
            <p className="text-sm text-gray-500 mb-1">Valor Pendente</p>
            <p className="text-xl font-semibold">{formatarMoeda(cliente.valorPendente)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full btn-fashion-primary">
                <Plus size={16} className="mr-2" />
                Adicionar Valor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Valor à Nota</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="text"
                      value={valorAdicao}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, '');
                        setValorAdicao(value);
                      }}
                      placeholder="0,00"
                      className="pl-10 input-fashion"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição (opcional)</label>
                  <Input
                    type="text"
                    value={descricaoAdicao}
                    onChange={(e) => setDescricaoAdicao(e.target.value)}
                    placeholder="Ex: Nova peça"
                    className="input-fashion"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nova Data de Vencimento (opcional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal input-fashion",
                          !dataVencimentoAdicao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataVencimentoAdicao ? (
                          format(dataVencimentoAdicao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          <span>Manter a data atual</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataVencimentoAdicao}
                        onSelect={handleSelectDataVencimentoAdicao}
                        initialFocus
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="btn-fashion-outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    onClick={handleAdicionarValor}
                    className="btn-fashion-primary"
                    disabled={!valorAdicao || parseFloat(valorAdicao.replace(',', '.')) <= 0}
                  >
                    Adicionar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full btn-fashion-outline">
                <Minus size={16} className="mr-2" />
                Registrar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Pagamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="text"
                      value={valorPagamento}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, '');
                        setValorPagamento(value);
                      }}
                      placeholder="0,00"
                      className="pl-10 input-fashion"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição (opcional)</label>
                  <Input
                    type="text"
                    value={descricaoPagamento}
                    onChange={(e) => setDescricaoPagamento(e.target.value)}
                    placeholder="Ex: Pagamento parcial"
                    className="input-fashion"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nova Data de Vencimento (opcional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal input-fashion",
                          !dataVencimentoPagamento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataVencimentoPagamento ? (
                          format(dataVencimentoPagamento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          <span>Manter a data atual</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataVencimentoPagamento}
                        onSelect={handleSelectDataVencimentoPagamento}
                        initialFocus
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="btn-fashion-outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    onClick={handleRegistrarPagamento}
                    className="btn-fashion-primary"
                    disabled={!valorPagamento || parseFloat(valorPagamento.replace(',', '.')) <= 0}
                  >
                    Registrar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="card-fashion p-6">
        <h3 className="text-lg font-medium mb-4">Histórico de Transações</h3>
        
        <div className="space-y-3">
          {cliente.transacoes.length > 0 ? (
            [...cliente.transacoes]
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .map((transacao) => (
                <div 
                  key={transacao.id} 
                  className={`p-4 rounded-md ${
                    transacao.tipo === 'adicao' 
                      ? 'bg-fashion-accent/20 border border-fashion-accent/30' 
                      : 'bg-fashion-tertiary/20 border border-fashion-tertiary/30'
                  }`}
                >
                  {transacaoEditando === transacao.id ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-600">
                          {formatarData(transacao.data)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => salvarEdicao(transacao.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={cancelarEdicao}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                          <Input
                            type="text"
                            value={valorEditando}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,]/g, '');
                              setValorEditando(value);
                            }}
                            placeholder="0,00"
                            className="pl-10 input-fashion"
                          />
                        </div>
                        
                        <Input
                          type="text"
                          value={descricaoEditando}
                          onChange={(e) => setDescricaoEditando(e.target.value)}
                          placeholder="Descrição (opcional)"
                          className="input-fashion"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-600">
                            {formatarData(transacao.data)}
                          </p>
                          {transacao.descricao && (
                            <>
                              <span className="text-gray-400">•</span>
                              <p className="text-sm text-gray-600">{transacao.descricao}</p>
                            </>
                          )}
                        </div>
                        <p className={`font-semibold ${
                          transacao.tipo === 'adicao' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transacao.tipo === 'adicao' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => iniciarEdicao(transacao)}
                          className="text-fashion-dark/70 hover:text-fashion-dark"
                        >
                          <Edit size={16} />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você tem certeza que deseja excluir esta transação? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removerTransacao(clienteId, transacao.id)}
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <p className="text-center py-4 text-gray-500">Nenhuma transação registrada</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalheCliente;
