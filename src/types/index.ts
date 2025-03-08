
export interface Cliente {
  id: string;
  nome: string;
  totalNota: number;
  valorPendente: number;
  valorAbatido: number;
  transacoes: Transacao[];
}

export interface Transacao {
  id: string;
  data: Date;
  valor: number;
  tipo: 'pagamento' | 'adicao';
  descricao?: string;
}

export interface EstatisticasGerais {
  totalNotas: number;
  totalPendente: number;
  totalAbatido: number;
}
