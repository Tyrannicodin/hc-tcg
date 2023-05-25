import classnames from 'classnames'
import CARDS from 'server/cards'
import Card from 'components/card'
import {SlotTypeT} from 'common/types/pick-process'
import {CardT, RowState} from 'common/types/game-state'
import css from './board.module.scss'

export type SlotProps = {
	type: SlotTypeT
	onClick?: () => void
	card: CardT | null
	rowState?: RowState
	active?: boolean
	cssId?: string
}

const Slot = ({type, onClick, card, rowState, active, cssId}: SlotProps) => {
	let cardInfo = card?.cardId ? CARDS[card.cardId] : null
	if (type === 'health' && rowState?.health) {
		cardInfo = {
			name: rowState.health + ' Health',
			rarity: 'common',
			type: 'health',
			health: rowState.health,
			id: 'health_' + rowState.health,
			attachReq: {target: 'player', type: ['health']},
		}
	}

	const ailments = Array.from(
		new Set(rowState?.ailments.map((a) => a.id) || [])
	)

	const frameImg =
		type === 'hermit' ? '/images/frame_glow.png' : '/images/frame.png'

	return (
		<div
			onClick={onClick}
			id={css[cssId || 'slot']}
			className={classnames(css.slot, {
				[css.available]: !!onClick,
				[css[type]]: true,
				[css.empty]: !cardInfo,
				// [css.afk]: cardInfo?.type === 'hermit' && !active,
				[css.afk]: !active && type !== 'single_use',
			})}
		>
			{cardInfo ? (
				<>
					<Card card={cardInfo} />
					{type === 'health' &&
						ailments.map((id) => {
							const cssClass = css[id + 'Ailment']
							if (!cssClass) return null
							return <div key={id} className={cssClass} />
						})}
				</>
			) : type === 'health' ? null : (
				<img draggable="false" className={css.frame} src={frameImg} />
			)}
		</div>
	)
}

export default Slot
