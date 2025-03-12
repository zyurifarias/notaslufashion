
import React from 'react';
import { ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-between pb-6 border-b border-fashion-primary/30">
      <div className="flex items-center gap-2">
        <div className="bg-fashion-primary/20 p-2 rounded-full">
          <ShoppingBag size={24} className="text-fashion-dark" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-semibold text-gray-800">LuFashion</h1>
          <p className="text-xs text-gray-500">Gerenciador de Notas</p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={logout}
        className="text-gray-500 hover:text-gray-700"
      >
        <LogOut size={18} className="mr-1" />
        Sair
      </Button>
    </div>
  );
};

export default Header;
