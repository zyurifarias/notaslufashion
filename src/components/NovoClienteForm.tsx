
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientes } from '@/contexts/ClienteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Calendar as CalendarIcon, Phone } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const NovoClienteForm: React.FC = () => {
  const [nome, setNome] = useState('');
  const [valorNota, setValorNota] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataVencimento, setDataVencimento] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { adicionarCliente } = useClientes();
  const navigate = useNavigate();

  const ajustarDataTimezone = (data: Date): Date => {
    const dataAjustada = new Date(data);
    dataAjustada.setHours(12, 0, 0, 0);
    return dataAjustada;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const valor = parseFloat(valorNota.replace(',', '.'));
    
    if (!nome.trim()) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Criar uma nova data para adicionar 1 dia antes de salvar
      const dataSalvar = new Date(dataVencimento);
      dataSalvar.setDate(dataSalvar.getDate() + 1);
      const dataAjustada = ajustarDataTimezone(dataSalvar);
      
      const novoClienteId = await adicionarCliente(nome.trim(), valor, dataAjustada, telefone);
      
      setNome('');
      setValorNota('');
      setTelefone('');
      setDataVencimento(new Date());
      
      if (novoClienteId) {
        navigate(`/cliente/${novoClienteId}`);
      }
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatarTelefone = (value: string) => {
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
      setTelefone(formatarTelefone(numbersOnly));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Atualizar a interface com a data selecionada sem adicionar o dia extra
      const newDate = new Date(date);
      setDataVencimento(newDate);
      setCalendarOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-fashion p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-fashion-primary/20 p-2 rounded-full">
          <UserPlus size={20} className="text-fashion-dark" />
        </div>
        <h2 className="text-lg font-sans font-medium">Nova Nota</h2>
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
          <Label htmlFor="telefone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <Input
              id="telefone"
              type="text"
              value={telefone}
              onChange={handleTelefoneChange}
              placeholder="(99) 99999-9999"
              className="pl-10 input-fashion"
            />
          </div>
          <p className="text-xs text-gray-500">Formato: (99) 99999-9999</p>
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
                const value = e.target.value.replace(/[^\d,]/g, '');
                setValorNota(value);
              }}
              placeholder="0,00"
              className="pl-10 input-fashion"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dataVencimento">Data de Vencimento</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                id="dataVencimento"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal input-fashion",
                  !dataVencimento && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataVencimento ? (
                  format(dataVencimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataVencimento}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button 
          type="submit" 
          className="w-full mt-4 btn-fashion-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Criando...' : 'Criar Nova Nota'}
        </Button>
      </div>
    </form>
  );
};

export default NovoClienteForm;
