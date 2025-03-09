
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import EstatisticasCard from '@/components/EstatisticasCard';
import ListaClientes from '@/components/ListaClientes';
import NotasVencidas from '@/components/NotasVencidas';
import NovoClienteForm from '@/components/NovoClienteForm';
import { Users, Receipt, AlertTriangle } from 'lucide-react';

const Index = () => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Header />
      
      <div className="mt-6">
        <EstatisticasCard />
        
        <Tabs defaultValue="clientes" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="clientes" className="flex items-center gap-2 data-[state=active]:bg-fashion-primary/20">
              <Users size={16} />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="nova-nota" className="flex items-center gap-2 data-[state=active]:bg-fashion-primary/20">
              <Receipt size={16} />
              Nova Nota
            </TabsTrigger>
            <TabsTrigger value="vencidas" className="flex items-center gap-2 data-[state=active]:bg-fashion-primary/20">
              <AlertTriangle size={16} />
              Vencidas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clientes">
            <ListaClientes />
          </TabsContent>
          
          <TabsContent value="nova-nota">
            <NovoClienteForm />
          </TabsContent>
          
          <TabsContent value="vencidas">
            <NotasVencidas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
