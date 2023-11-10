import Modal from 'components/modal'
import {useDispatch} from 'react-redux'
import css from './game-modals.module.scss'
import Button from 'components/button'
import {modalRequest} from 'logic/game/game-actions'
import {useSelector} from 'react-redux'
import {getOpponentActiveRow} from '../game-selectors'
import {HERMIT_CARDS} from 'common/cards'
import Attack from './attack-modal/attack'

type Props = {
	closeModal: () => void
}
function EvilXModal({closeModal}: Props) {
	const dispatch = useDispatch()
	const opponentRow = useSelector(getOpponentActiveRow)

	if (!opponentRow || !opponentRow.hermitCard) return null

	const opponentHermitInfo = HERMIT_CARDS[opponentRow.hermitCard.cardId]

	const hermitFullName = opponentRow.hermitCard.cardId.split('_')[0]

	const handlePrimary = () => {
		dispatch(modalRequest({modalResult: {disable: 'primary'}}))
		closeModal()
	}

	const handleSecondary = () => {
		dispatch(modalRequest({modalResult: {disable: 'secondary'}}))
		closeModal()
	}

	return (
		<Modal closeModal={handleSecondary} title="Evil X: Disable an attack for 1 turn">
			<div className={css.confirmModal}>
				<div className={css.description}>
					Which of the opponent's attacks do you want to disable?
				</div>
				<div className={css.description}>
					<Attack
						key="primary"
						name={opponentHermitInfo.primary.name}
						icon={`/images/hermits-nobg/${hermitFullName}.png`}
						attackInfo={opponentHermitInfo.primary}
						onClick={handlePrimary}
					/>
					<Attack
						key="secondary"
						name={opponentHermitInfo.secondary.name}
						icon={`/images/hermits-nobg/${hermitFullName}.png`}
						attackInfo={opponentHermitInfo.secondary}
						onClick={handleSecondary}
					/>
				</div>
			</div>
		</Modal>
	)
}

export default EvilXModal
