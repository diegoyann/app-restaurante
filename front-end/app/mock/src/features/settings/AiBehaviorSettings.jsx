import React, { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Globe,
  Mail,
  Save,
  ShieldCheck,
  Star,
  TriangleAlert,
  Wallet,
  MessageCircle
} from 'lucide-react';
import './AiBehaviorSettings.css';

const TONE_OPTIONS = [
  {
    id: 'friendly',
    label: 'Amigável & Leve',
    example: '"Muito obrigado pelo feedback, João. Volte sempre!"'
  },
  {
    id: 'formal',
    label: 'Corporativo & Formal',
    example: '"Agradecemos a sua preferência, Sr. João. Estamos à disposição."'
  },
  {
    id: 'modern',
    label: 'Empolgado & Moderno',
    example: '"Uau, João. Que incrível saber disso. Te esperamos de novo!"'
  }
];

const CRISIS_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'Pedir para ligar / WhatsApp',
    description: 'Direciona o cliente irritado para o telefone ou WhatsApp cadastrado na loja.',
    icon: MessageCircle
  },
  {
    id: 'email',
    label: 'Pedir para enviar E-mail',
    description: 'Direciona o cliente para o e-mail do suporte, gerência ou operação.',
    icon: Mail
  }
];

const NAV_ITEMS = [
  { id: 'ai-behavior', label: 'Comportamento da IA', icon: Bot, active: true },
  { id: 'white-label', label: 'White-Label', icon: Globe, active: false },
  { id: 'billing', label: 'Faturamento e Plano', icon: Wallet, active: false }
];

export default function AiBehaviorSettingsPage({
  value,
  onSave,
  errorMessage,
  successMessage
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const instructionCount = draft.additionalInstructions.length;
  const isOverLimit = instructionCount > 150;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isOverLimit) return;
    onSave(draft);
  };

  return (
    <div className="ai-settings">
      <header className="ai-settings__header">
        <h2>Configurações</h2>
        <p>Gerencie a resposta automática, o tom da IA e o fluxo de crise sem deixar a operação parecer robô burro.</p>
      </header>

      <div className="ai-settings__shell">
        <aside className="ai-settings__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ai-settings__nav-item ${item.active ? 'ai-settings__nav-item--active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <section className="ai-settings__panel">
          <div className="ai-settings__panel-header">
            <Bot size={20} className="text-[#635bff]" />
            <h3>Comportamento do Piloto Automático</h3>
          </div>

          <form className="ai-settings__content" onSubmit={handleSubmit}>
            <div className="ai-settings__section">
              <div className="ai-settings__section-title">
                <Star size={18} className="text-green-500 mt-1" />
                <div>
                  <h4>Tom de Voz (Avaliações Positivas)</h4>
                  <p>Como a Inteligência Artificial deve soar ao agradecer seus clientes em notas altas.</p>
                </div>
              </div>

              <div className="ai-settings__tone-grid">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, positiveTone: option.id }))}
                    className={`ai-settings__choice ai-settings__choice--tone ${draft.positiveTone === option.id ? 'ai-settings__choice--selected' : ''}`}
                  >
                    <div className="ai-settings__choice-head">
                      <strong>{option.label}</strong>
                      {draft.positiveTone === option.id && <CheckCircle2 size={18} className="text-[#4f46e5]" />}
                    </div>
                    <p className="ai-settings__choice-example">{option.example}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-settings__section">
              <div className="ai-settings__section-title">
                <TriangleAlert size={18} className="text-orange-500 mt-1" />
                <div>
                  <h4>Estratégia de Gestão de Crise (1 a 3 Estrelas)</h4>
                  <p>Ao gerar um rascunho de desculpas, para onde a IA deve empurrar a conversa.</p>
                </div>
              </div>

              <div className="ai-settings__strategy-grid">
                {CRISIS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, crisisStrategy: option.id }))}
                    className={`ai-settings__choice ai-settings__choice--strategy ${draft.crisisStrategy === option.id ? 'ai-settings__choice--selected' : ''}`}
                  >
                    <div className="ai-settings__choice-head">
                      <strong>{option.label}</strong>
                      {draft.crisisStrategy === option.id && <CheckCircle2 size={18} className="text-[#f97316]" />}
                    </div>
                    <p>{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-settings__section">
              <div className="ai-settings__section-title">
                <Bot size={18} className="text-slate-500 mt-1" />
                <div>
                  <h4>Instruções Adicionais Seguras (Opcional)</h4>
                  <p>Defina termos que a IA sempre deve usar. Limite curto de propósito, para não virar prompt podre.</p>
                </div>
              </div>

              <div className="ai-settings__textarea-wrap">
                <textarea
                  value={draft.additionalInstructions}
                  onChange={(event) => setDraft((prev) => ({ ...prev, additionalInstructions: event.target.value }))}
                  placeholder='Ex: Assine todas as respostas como "A Direção do Rei das Esfihas".'
                  className="ai-settings__textarea"
                />
                <span className="ai-settings__counter" style={{ color: isOverLimit ? '#dc2626' : undefined }}>
                  {instructionCount}/150 caracteres máx.
                </span>
              </div>
            </div>

            <div className="ai-settings__section">
              <div className="ai-settings__toggle">
                <div className="ai-settings__toggle-copy">
                  <strong>Publicação Automática (Notas 4 e 5)</strong>
                  <p>Permitir que o sistema publique respostas positivas sem intervenção humana.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, autoPublishPositive: !prev.autoPublishPositive }))}
                  className={`ai-settings__switch ${draft.autoPublishPositive ? 'ai-settings__switch--on' : ''}`}
                  aria-pressed={draft.autoPublishPositive}
                  aria-label="Alternar publicação automática de avaliações positivas"
                />
              </div>
            </div>

            {errorMessage && <div className="ai-settings__feedback ai-settings__feedback--error">{errorMessage}</div>}
            {successMessage && <div className="ai-settings__feedback ai-settings__feedback--success">{successMessage}</div>}

            <div className="ai-settings__footer">
              <div className="ai-settings__safe-note">
                <ShieldCheck size={18} className="text-green-500" />
                <span>O motor deve manter educação e controle, mesmo quando o cliente vier espumando.</span>
              </div>

              <button type="submit" className="ai-settings__save" disabled={isOverLimit}>
                <Save size={18} />
                Salvar Configurações
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
