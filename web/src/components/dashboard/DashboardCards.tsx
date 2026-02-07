import { useState } from 'react'
import { Plus, LayoutGrid, ChevronDown, ChevronRight, Layout } from 'lucide-react'
import { CardWrapper } from '../cards/CardWrapper'
import { CARD_COMPONENTS, DEMO_DATA_CARDS, LIVE_DATA_CARDS } from '../cards/cardRegistry'
import { AddCardModal } from './AddCardModal'
import { TemplatesModal } from './TemplatesModal'
import { ConfigureCardModal } from './ConfigureCardModal'
import { DashboardTemplate } from './templates'
import { DashboardCard } from '../../hooks/useDashboardCards'
import { formatCardTitle } from '../../lib/formatCardTitle'
import { DashboardHealthIndicator } from './DashboardHealthIndicator'
import { useModals } from '../../hooks/useModal'

interface CardSuggestion {
  type: string
  title: string
  config: Record<string, unknown>
}

interface DashboardCardsProps {
  cards: DashboardCard[]
  onAddCard: (cardType: string, config?: Record<string, unknown>, title?: string) => void
  onRemoveCard: (cardId: string) => void
  onUpdateCardConfig: (cardId: string, config: Record<string, unknown>) => void
  onReplaceCards: (cards: DashboardCard[]) => void
  /** Title shown in the collapsible header */
  sectionTitle?: string
  /** Placeholder content when no cards */
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  /** Start collapsed? */
  defaultCollapsed?: boolean
}

export function DashboardCards({
  cards,
  onAddCard,
  onRemoveCard,
  onUpdateCardConfig,
  onReplaceCards,
  sectionTitle = 'Dashboard Cards',
  emptyIcon,
  emptyTitle = 'No cards added',
  emptyDescription = 'Add cards to customize this dashboard.',
  defaultCollapsed = false,
}: DashboardCardsProps) {
  const [showCards, setShowCards] = useState(!defaultCollapsed)
  const modals = useModals(['addCard', 'templates', 'configure'])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const handleAddCards = (suggestions: CardSuggestion[]) => {
    suggestions.forEach(card => {
      onAddCard(card.type, card.config, card.title)
    })
    modals.closeModal('addCard')
  }

  const handleConfigureCard = (cardId: string) => {
    setSelectedCardId(cardId)
    modals.openModal('configure')
  }

  const handleSaveConfig = (cardId: string, config: Record<string, unknown>, _title?: string) => {
    onUpdateCardConfig(cardId, config)
    modals.closeModal('configure')
    setSelectedCardId(null)
  }

  const handleApplyTemplate = (template: DashboardTemplate) => {
    const newCards: DashboardCard[] = template.cards.map((card, idx) => ({
      id: `${card.card_type}-${Date.now()}-${idx}`,
      card_type: card.card_type,
      config: card.config || {},
      title: card.title,
    }))
    onReplaceCards(newCards)
    modals.closeModal('templates')
  }

  const selectedCard = cards.find(c => c.id === selectedCardId)
  // Transform to the Card format expected by ConfigureCardModal
  const configureCard = selectedCard ? {
    id: selectedCard.id,
    card_type: selectedCard.card_type,
    config: selectedCard.config,
    title: selectedCard.title,
  } : null

  return (
    <div className="mt-6">
      {/* Header with toggle and actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCards(!showCards)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{sectionTitle} ({cards.length})</span>
            {showCards ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {/* Health indicator */}
          <DashboardHealthIndicator size="sm" />
        </div>

        {showCards && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => modals.openModal('templates')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <Layout className="w-3.5 h-3.5" />
              Templates
            </button>
            <button
              onClick={() => modals.openModal('addCard')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Card
            </button>
          </div>
        )}
      </div>

      {/* Cards grid */}
      {showCards && (
        <>
          {cards.length === 0 ? (
            <div className="glass p-8 rounded-lg border-2 border-dashed border-border/50 text-center">
              {emptyIcon && <div className="flex justify-center mb-4">{emptyIcon}</div>}
              <h3 className="text-lg font-medium text-foreground mb-2">{emptyTitle}</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                {emptyDescription}
              </p>
              <button
                onClick={() => modals.openModal('addCard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Cards
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(card => {
                const CardComponent = CARD_COMPONENTS[card.card_type]
                if (!CardComponent) {
                  return null
                }
                return (
                  <CardWrapper
                    key={card.id}
                    cardId={card.id}
                    cardType={card.card_type}
                    title={formatCardTitle(card.card_type)}
                    onConfigure={() => handleConfigureCard(card.id)}
                    onRemove={() => onRemoveCard(card.id)}
                    isDemoData={DEMO_DATA_CARDS.has(card.card_type)}
                    isLive={LIVE_DATA_CARDS.has(card.card_type)}
                  >
                    <CardComponent config={card.config} />
                  </CardWrapper>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddCardModal
        isOpen={modals.isModalOpen('addCard')}
        onClose={() => modals.closeModal('addCard')}
        onAddCards={handleAddCards}
      />

      <TemplatesModal
        isOpen={modals.isModalOpen('templates')}
        onClose={() => modals.closeModal('templates')}
        onApplyTemplate={handleApplyTemplate}
      />

      <ConfigureCardModal
        isOpen={modals.isModalOpen('configure')}
        onClose={() => {
          modals.closeModal('configure')
          setSelectedCardId(null)
        }}
        card={configureCard}
        onSave={handleSaveConfig}
      />
    </div>
  )
}
