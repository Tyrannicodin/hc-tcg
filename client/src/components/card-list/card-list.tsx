import cn from 'classnames'
import CARDS from 'server/cards'
import {CardT} from 'common/types/game-state'
import Card from 'components/card'
import css from './card-list.module.scss'
import {equalCard} from 'server/utils'
import {CSSTransition, TransitionGroup} from 'react-transition-group'

type CardListProps = {
	cards: Array<CardT>
	disabled?: Array<string>
	selected?: CardT | null
	picked?: Array<CardT>
	onClick?: (card: CardT) => void
	wrap?: boolean
}

const CardList = (props: CardListProps) => {
	const {wrap, onClick, cards, disabled, selected, picked} = props

	const cardsOutput = cards.map((card) => {
		const info = CARDS[card.cardId]
		if (!info) return null
		const isSelected = equalCard(card, selected)
		const isPicked = !!picked?.find((pickedCard) => equalCard(card, pickedCard))
		const isDisabled = !!disabled?.find((id) => card.cardId === id)

		return (
			<CSSTransition
				timeout={250}
				key={card.cardInstance}
				unmountOnExit={true}
				classNames={{
					enter: css.enter,
					enterActive: css.enterActive,
					enterDone: css.enterDone,
					exit: css.exit,
					exitActive: css.exitActive,
				}}
			>
				<Card
					key={card.cardInstance}
					className={cn(css.card, {
						[css.clickable]: !!onClick && !isDisabled,
					})}
					onClick={onClick && !isDisabled ? () => onClick(card) : undefined}
					card={info}
					disabled={isDisabled}
					selected={isSelected}
					picked={!!isPicked}
				/>
			</CSSTransition>
		)
	})

	return (
		<TransitionGroup className={cn(css.cardList, {[css.wrap]: wrap})}>
			{cardsOutput}
		</TransitionGroup>
	)
}

export default CardList
