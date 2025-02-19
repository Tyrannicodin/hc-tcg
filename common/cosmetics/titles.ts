import British from '../achievements/british'
import CertifiedZombie from '../achievements/certified-zombie'
import DefeatEvilX from '../achievements/defeat-evil-x'
import Ethogirl from '../achievements/ethogirl'
import OreSnatcher from '../achievements/ore-snatcher'
import { Win1 } from '../achievements/wins'
import {Title} from './types'

const TitleDefinitions: Omit<Title, 'type'>[] = [
	{
		id: 'no_title',
		name: '',
	},
	{
		id: 'british',
		name: "Bri'ish",
		requires: British.id,
	},
	{
		id: 'certified-zombie',
		name: 'Certified Zombie',
		requires: CertifiedZombie.id,
	},
	{
		id: 'ethogirl',
		name: 'Ethogirl',
		requires: Ethogirl.id,
	},
	{
		id: 'evil_xterminator',
		name: 'Evil X-Terminator',
		requires: DefeatEvilX.id,
	},
	{
		id: 'victor',
		name: 'Victor',
		requires: Win1.id,
	},
	{
		id:'ore_snatcher',
		name: 'Ore Snatcher',
		requires: OreSnatcher.id
	},
]

export const ALL_TITLES: Title[] = TitleDefinitions.map((title) => ({
	type: 'title',
	...title,
}))

export const TITLES: Record<string | number, Title> = ALL_TITLES.reduce(
	(result: Record<string | number, Title>, card) => {
		result[card.id] = card
		return result
	},
	{},
)
