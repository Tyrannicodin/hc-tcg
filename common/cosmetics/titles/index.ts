import {Title} from '../types'
import BritishTitle from './british'
import EmptyTitle from './empty'
import EthogirlTitle from './ethogirl'
import EvilXTerminatorTitle from './evil-xterminator'

export const ALL_TITLES: Title[] = [
	EmptyTitle,
	EthogirlTitle,
	EvilXTerminatorTitle,
	BritishTitle,
]

export const TITLES: Record<string | number, Title> = ALL_TITLES.reduce(
	(result: Record<string | number, Title>, card) => {
		result[card.id] = card
		return result
	},
	{},
)
