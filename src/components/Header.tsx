
import React from 'react';
import { Shirt } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-fashion-primary/30">
      <div className="flex items-center gap-2">
        <div className="bg-fashion-primary/20 p-2 rounded-full">
          <Shirt size={24} className="text-fashion-dark" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-semibold text-gray-800">LuFashion</h1>
          <p className="text-xs text-gray-500">Gerenciador de Notas</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
