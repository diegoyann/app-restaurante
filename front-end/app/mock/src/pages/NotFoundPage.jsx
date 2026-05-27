import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, SearchX, UtensilsCrossed } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#1f1f1c] flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2A1E15] flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="text-[#D4A373]" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D4A373]">
                GestãoFood
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#696965]">
                Rei das Esfihas
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-[#2A1E15]">
              Erro 404
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-normal text-[#2A1E15] leading-[0.95]">
              Página não encontrada
            </h1>
            <p className="max-w-2xl text-base sm:text-lg font-semibold text-[#696965] leading-relaxed">
              A rota acessada não existe ou foi removida. Volte para uma área válida da aplicação.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1E15] px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-md hover:bg-[#4a1718] transition-colors"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2A1E15]/20 bg-white px-5 py-3 text-sm font-black uppercase tracking-widest text-[#2A1E15] shadow-sm hover:border-[#D4A373] hover:text-[#8a6a20] transition-colors"
            >
              <Home size={18} />
              Início
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] sm:min-h-[340px] rounded-[2rem] bg-[#2A1E15] overflow-hidden shadow-2xl border border-[#3a1213]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(197,160,74,0.28),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_30%)]" />
          <div className="relative h-full min-h-[280px] sm:min-h-[340px] flex flex-col items-center justify-center p-8 text-center">
            <SearchX className="text-[#D4A373] mb-6" size={72} strokeWidth={1.5} />
            <p className="text-[8rem] sm:text-[9rem] font-black text-white/10 leading-none tracking-normal">
              404
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-[#D4A373]">
              Rota inválida
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
