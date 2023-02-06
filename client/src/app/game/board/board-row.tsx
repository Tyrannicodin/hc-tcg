import {BoardRowT} from 'types/game-state'
import {CardT} from 'types/game-state'
import Slot, {SlotType} from './board-slot'
import css from './board.module.css'

const getCardBySlot = (
	slotType: SlotType,
	index: number,
	rowState: BoardRowT | null
): CardT | null => {
	if (!rowState) return null
	if (slotType === 'hermit') return rowState.hermitCard || null
	if (slotType === 'effect') return rowState.effectCard || null
	if (slotType === 'item') return rowState.itemCards[index] || null
	return null
}

type BoardRowProps = {
	type: 'left' | 'right'
	onClick: (meta: any) => void
	rowState: BoardRowT
	active: boolean
}
const BoardRow = ({type, onClick, rowState, active}: BoardRowProps) => {
	const handleSlotClick = (
		slotType: SlotType,
		slotIndex: number,
		card: CardT | null
	) => {
		onClick({slotType, slotIndex, card})
	}
	const slotTypes: Array<SlotType> = [
		'item',
		'item',
		'item',
		'effect',
		'hermit',
		'health',
	]
	const slots = slotTypes.map((slotType, index) => {
		const card = getCardBySlot(slotType, index, rowState)
		return (
			<Slot
				onClick={() => handleSlotClick(slotType, index, card)}
				card={card}
				rowState={rowState}
				active={active}
				key={slotType + '-' + index}
				type={slotType}
			/>
		)
	})
	if (type === 'right') slots.reverse()
	return <div className={css.hermitRow}>{slots}</div>
}

export default BoardRow
