import Modal from 'components/modal'
import {useSelector} from 'react-redux'
import CardList from 'components/card-list'
import {CardT} from 'common/types/game-state'
// import css from './spyglass-modal.module.css'
import css from './game-modals.module.scss'
import {getPlayerState} from 'logic/game/game-selectors'
import Button from 'components/button'

type Props = {
	closeModal: () => void
}
function SpyglassModal({closeModal}: Props) {
	const spyglass: Array<CardT> =
		useSelector(getPlayerState)?.custom.spyglass || []

	console.log('Spyglass:', useSelector(getPlayerState))

	return (
		<Modal title="Spyglass" closeModal={closeModal}>
			<div className={css.wrapper}>
				<div className={css.cards}>
					<CardList cards={spyglass} />
				</div>
				<div className={css.options}>
					<Button onClick={closeModal}>Ahaaa</Button>
				</div>
			</div>
		</Modal>
	)
}

export default SpyglassModal
